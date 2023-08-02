import { Decimal } from "decimal.js";

import { PositionInfo } from "../position.js";
import { retrieveTicksData, retrieveSwapsWithinRange } from "../stores.js";
import {
  applyDecimals,
  getActiveTick,
  getDelta0,
  getDelta1,
} from "../helpers/v3_math.js";

/**
 * Compute Exact feeShare at a block given transaction details, precision may be limited to tick data quality.
 *
 * @param ticks Ticks states in this block
 * @param swapsThisBlock Swaps happening in this block
 * @param position The referenced position
 * @param tickSpacing TickSpacing of the pool.
 * */
export function getExactFeeShare(
  ticks: Awaited<ReturnType<typeof retrieveTicksData>>,
  swapsThisBlock: Awaited<ReturnType<typeof retrieveSwapsWithinRange>>,
  position: PositionInfo,
  tickSpacing: number
): { feeShare0: number; feeShare1: number } {
  const positionLiquidity = new Decimal(position.liquidity.toString());
  let positionFeeRatio0 = 0;
  let positionFeeRatio1 = 0;
  const { lowerTick, upperTick, decimals0, decimals1 } = position;

  swapsThisBlock.forEach(({ tick: tickAfterSwap, amount0, amount1, blockNumber }) => {
    const activeTickAfter = getActiveTick(tickAfterSwap, tickSpacing);
    const liquidityAfter = ticks.findLast(
      ({ tickIdx }) => tickIdx <= activeTickAfter
    )?.liquidityActive;

    if (!liquidityAfter) {
      console.info("Ticks: ", ticks);
      console.info("Active tick: ", activeTickAfter);
      const msg = `Pool collection error: Dirty tick out of range at ${blockNumber}`;
      throw new Error(msg);
    }

    let currentTick = tickAfterSwap;
    let previousTick: number;
    let liquidity = BigInt(liquidityAfter);
    let feeRatioConsumable = 1;

    function computeSwapStep(totalAmount: number, zeroForOne: boolean) {
      const amountConsumed = zeroForOne
        ? applyDecimals(
          getDelta1(liquidity, currentTick, previousTick),
          decimals1
        )
        : applyDecimals(
          getDelta0(liquidity, currentTick, previousTick),
          decimals0
        );

      const feeRatioConsumed = Math.min(
        amountConsumed / totalAmount,
        feeRatioConsumable
      );
      feeRatioConsumable -= feeRatioConsumed;

      const inRange = currentTick >= lowerTick && currentTick < upperTick;
      if (inRange) {
        const positionShare = positionLiquidity
          .div(new Decimal(liquidity.toString()))
          .mul(feeRatioConsumed)
          .toNumber();
        if (zeroForOne) {
          positionFeeRatio0 += positionShare;
        } else {
          positionFeeRatio1 += positionShare;
        }
      }
    }

    // NOTE: we trace BACK liquidity share (tick is recorded AFTER SWAP HAPPENED).
    function computeSwap_Backward(zeroForOne: boolean) {
      const tickStep = zeroForOne ? tickSpacing : -tickSpacing;
      const totalSwapAmount = zeroForOne ? -amount1 : -amount0;

      previousTick = activeTickAfter + tickStep;

      while (feeRatioConsumable > 0) {
        computeSwapStep(totalSwapAmount, zeroForOne);

        currentTick = previousTick;
        previousTick += tickStep;

        let nextTickLiquidity = ticks.findLast(
          ({ tickIdx }) => tickIdx <= previousTick
        )?.liquidityActive;

        if (nextTickLiquidity) {
          liquidity = BigInt(nextTickLiquidity);
        } else {
          // NOTE: precision loss due to narrow ticks boundary, use closest liquidity value
        }
      }
    }

    computeSwap_Backward(amount0 > 0);
  });

  return { feeShare0: positionFeeRatio0, feeShare1: positionFeeRatio1 };
}
