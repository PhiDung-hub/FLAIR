import { getPoolTick } from "./subgraph.js";
import {
  getLiquidityFromDelta0,
  getLiquidityFromDelta1,
  getDelta0,
  getDelta1,
  stripDecimals,
  applyDecimals,
  getActiveTick,
} from "./helpers/v3_math.js";
import { assertRetrievePool } from "./stores.js";

export type PositionInfo = {
  period: { fromBlock: number; toBlock: number };
  startAtTick: number;
  lowerTick: number;
  upperTick: number;
  amount0: number;
  amount1: number;
  decimals0: number;
  decimals1: number;
  liquidity: bigint;
  poolAddress: `0x${string}`;
};

/**
 * Start providing liquidity in an active tick for a sepecified pool at a particular block (time).
 *
 * @param lowerRange lower bound from the nearest active tick in multiple of tickSpacing.
 * @param upperRange upper bound from the nearest active tick in multiple of tickSpacing.
 * @param amount1 Amount of token1 to deposit in the LP
 *
 * @returns Liquidity distribution of this position
 * */
export async function startInRangePosition(
  period: { fromBlock: number; toBlock: number },
  poolAddress: `0x${string}`,
  lowerRange: number,
  upperRange: number,
  amount: number,
  useToken1 = true
): Promise<PositionInfo> {
  if (lowerRange < 0 || upperRange <= 0) {
    throw new Error("Invalid range");
  }

  const { decimals0, decimals1, tickSpacing } = await assertRetrievePool({
    address: poolAddress,
  });

  const tick = await getPoolTick(poolAddress, period.fromBlock);
  const nearestInitializableTick = getActiveTick(tick, tickSpacing);

  const lowerTick = nearestInitializableTick - lowerRange * tickSpacing;
  const upperTick = nearestInitializableTick + upperRange * tickSpacing;

  let amount0, amount1, liquidity;
  if (useToken1) {
    amount1 = amount;
    liquidity = getLiquidityFromDelta1(
      stripDecimals(amount, decimals1),
      tick,
      upperTick
    );
    amount0 = applyDecimals(getDelta0(liquidity, tick, lowerTick), decimals0);
  } else {
    if (lowerRange == 0 && tick % tickSpacing == 0) {
      throw new Error("Invalid position, infinite liquidity required");
    }
    amount0 = amount;
    liquidity = getLiquidityFromDelta0(
      stripDecimals(amount, decimals0),
      tick,
      lowerTick
    );
    amount1 = applyDecimals(getDelta1(liquidity, tick, upperTick), decimals1);
  }

  return {
    period,
    startAtTick: tick,
    lowerTick,
    upperTick,
    amount0,
    amount1,
    decimals0,
    decimals1,
    liquidity,
    poolAddress,
  };
}

export async function startOutOfRangePosition(
  period: { fromBlock: number; toBlock: number },
  poolAddress: `0x${string}`,
  rangeWidth: number,
  outRange: number,
  amount: number
): Promise<PositionInfo> {
  if (rangeWidth <= 0) {
    throw new Error("Invalid position Id");
  }
  const { decimals0, decimals1, tickSpacing } = await assertRetrievePool({
    address: poolAddress,
  });

  const tick = await getPoolTick(poolAddress, period.fromBlock);
  const nearestInitializableTick = getActiveTick(tick, tickSpacing);

  let amount0, amount1, liquidity, lowerTick, upperTick;

  if (outRange > 0) {
    lowerTick = nearestInitializableTick + outRange * tickSpacing;
    upperTick = lowerTick + rangeWidth * tickSpacing;
    amount1 = amount;
    amount0 = 0;
    liquidity = getLiquidityFromDelta1(
      stripDecimals(amount1, decimals1),
      lowerTick,
      upperTick
    );
  } else {
    upperTick = nearestInitializableTick + outRange * tickSpacing;
    lowerTick = upperTick - rangeWidth * tickSpacing;
    amount0 = amount;
    amount1 = 0;
    liquidity = getLiquidityFromDelta0(
      stripDecimals(amount0, decimals0),
      upperTick,
      lowerTick
    );
  }

  return {
    period,
    startAtTick: tick,
    lowerTick,
    upperTick,
    amount0,
    amount1,
    decimals0,
    decimals1,
    liquidity,
    poolAddress,
  };
}
