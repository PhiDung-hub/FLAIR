import { Decimal } from "decimal.js";

import { PositionInfo } from "../position.js";
import { retrieveTicksData, retrieveSwapsWithinRange } from "../stores.js";
import { getActiveTick } from "../helpers/v3_math.js";

/**
 * Estimate fee of a position given transaction details.
 * This function ignores ALL TICK CROSSING DURING SWAPS.
 *
 * @param ticks Ticks states in this block
 * @param swaps Swaps happening in this block
 * @param position The referenced position
 * @param tickSpacing TickSpacing of the pool.
 * */
export function getFeeShareEstimated(
  ticks: Awaited<ReturnType<typeof retrieveTicksData>>,
  swaps: Awaited<ReturnType<typeof retrieveSwapsWithinRange>>,
  position: PositionInfo,
  tickSpacing: number
): { feeShare0: number; feeShare1: number } {
  const positionLiquidity = new Decimal(position.liquidity.toString());
  let feeRatio0 = new Decimal(0);
  let feeRatio1 = new Decimal(0);
  let totalVolume0 = new Decimal(0);
  let totalVolume1 = new Decimal(0);

  const { lowerTick, upperTick } = position;

  swaps.forEach(({ tick, amount0, amount1, blockNumber }) => {
    if (tick < lowerTick || tick >= upperTick) {
      return;
    }
    const beforeSwapActiveTick = getActiveTick(tick, tickSpacing);
    const liquidityActive = ticks.findLast(
      ({ tickIdx }) => tickIdx <= beforeSwapActiveTick
    )?.liquidityActive;

    if (!liquidityActive) {
      console.info("Active tick: ", beforeSwapActiveTick);
      const msg = `Pool collection error: Dirty tick out of range at ${blockNumber}`;
      throw new Error(msg);
    }

    if (amount0 > 0) {
      feeRatio0 = feeRatio0.add(
        positionLiquidity.div(new Decimal(liquidityActive)).mul(amount0)
      );
      totalVolume0 = totalVolume0.add(amount0);
    } else {
      // amount 1 > 0
      feeRatio1 = feeRatio1.add(
        positionLiquidity.div(new Decimal(liquidityActive)).mul(amount1)
      );
      totalVolume1 = totalVolume1.add(amount1);
    }
  });
  const feeShare0 = totalVolume0.gt(0)
    ? feeRatio0.div(totalVolume0).toNumber()
    : 0;

  const feeShare1 = totalVolume1.gt(0)
    ? feeRatio1.div(totalVolume1).toNumber()
    : 0;

  return { feeShare0, feeShare1 };
}
