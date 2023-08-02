import { Decimal } from "decimal.js";
import { PositionInfo } from "../position.js";

const ONE_TICK = new Decimal(1.0001);
const TEN = new Decimal(10);
const Q96 = new Decimal(2).pow(96);

/**
 * Convert Decimal to BigInt, handle case `<x>.<y>e+<exponent>`, e.g. 1.23e+26
 **/
export function decimalToBigInt(decimal: Decimal) {
  const formattedString = decimal
    .round()
    .toString()
    .replace(/(\d+\.\d+)e\+(\d+)/, (_, number, exponent) => {
      const decimalPart = number.split(".")[1]; // Extract the decimal part
      const zeros = "0".repeat(exponent - decimalPart.length); // Append necessary zeros
      return `${number.replace(".", "")}${zeros}`;
    });
  return BigInt(formattedString);
}

/**
 * Calculate un-normalized token0 change when ticks move from `fromTick` to `toTick`
 * @param liquidity Amount of liquidity = sqrt(amount0 * amount1 * 10^(decimals0 + decimals1))
 * @param fromTick Start tick
 * @param toTick End tick
 * @returns amount0 * 10^decimals0
 **/
export function getDelta0(liquidity: bigint, fromTick: number, toTick: number) {
  const inverseSqrtPriceA = ONE_TICK.pow(new Decimal(-fromTick / 2));
  const inverseSqrtPriceB = ONE_TICK.pow(new Decimal(-toTick / 2));

  return new Decimal(liquidity.toString()).mul(
    inverseSqrtPriceB.sub(inverseSqrtPriceA)
  );
}

/**
 * Calculate un-normalized token1 change when ticks move from `fromTick` to `toTick`
 * @param liquidity Amount of liquidity = sqrt(amount0 * amount1 * 10^(decimals0 + decimals1))
 * @param fromTick Start tick
 * @param toTick End tick
 * @returns amount1 * 10^decimals1
 **/
export function getDelta1(liquidity: bigint, fromTick: number, toTick: number) {
  const sqrtPriceA = ONE_TICK.pow(new Decimal(fromTick / 2));
  const sqrtPriceB = ONE_TICK.pow(new Decimal(toTick / 2));

  return new Decimal(liquidity.toString()).mul(sqrtPriceB.sub(sqrtPriceA));
}

/**
 * Calculate liquidity given amount of token0 changed from `upperTick` to `lowerTick`. Convention is not strictly enforced
 * @param delta0 Un-normalized amount of token0 changed = amount0Changed * 10^decimals0
 * @param upperTick the higher tick
 * @param lowerTick the lower tick
 * @returns liquidity amount, can be negative based on input
 **/
export function getLiquidityFromDelta0(
  delta0: Decimal,
  upperTick: number,
  lowerTick: number
) {
  const deltaInverseSqrtPrice = ONE_TICK.pow(new Decimal(-lowerTick / 2)).sub(
    ONE_TICK.pow(new Decimal(-upperTick / 2))
  );
  const liquidity = delta0.div(deltaInverseSqrtPrice);
  return decimalToBigInt(liquidity);
}

/**
 * Calculate liquidity given amount of token1 changed from `lowerTick` to `upperTick`. Convention is not strictly enforced
 * @param delta1 Un-normalized amount of token1 changed = amount1Changed * 10^decimals1
 * @param lowerTick the lower tick
 * @param upperTick the higher tick
 * @returns liquidity amount, can be negative based on input
 **/
export function getLiquidityFromDelta1(
  delta1: Decimal,
  lowerTick: number,
  upperTick: number
) {
  const deltaSqrtPrice = ONE_TICK.pow(new Decimal(upperTick / 2)).sub(
    ONE_TICK.pow(new Decimal(lowerTick / 2))
  );
  const liquidity = delta1.div(deltaSqrtPrice);
  return decimalToBigInt(liquidity);
}

/**
 * Get the current active tick
 * */
export function getActiveTick(tick: number, tickSpacing: number) {
  return Math.floor(tick / tickSpacing) * tickSpacing;
}

/**
 * Compute position value given current tick, returns amount in token0 (Base token).
 * */
export function computePositionValue(
  position: PositionInfo,
  currentTick: number
) {
  const {
    amount0,
    amount1,
    decimals0,
    decimals1,
    lowerTick,
    upperTick,
    liquidity,
    startAtTick,
  } = position;

  if (currentTick < lowerTick || currentTick >= upperTick) {
    return Infinity;
  } else {
    const delta0 = getDelta0(liquidity, startAtTick, currentTick);
    const amount0Changed = delta0.div(new Decimal(10 ** decimals0)).toNumber();

    const delta1 = getDelta1(liquidity, startAtTick, currentTick);
    const amount1Changed = delta1.div(new Decimal(10 ** decimals1)).toNumber();

    const price1Now = new Decimal(1.0001)
      .pow(new Decimal(currentTick))
      .mul(new Decimal(10 ** (decimals0 - decimals1)))
      .toNumber();
    const price0Now = 1 / price1Now;

    const totalAmount0 =
      amount0 + amount0Changed + (amount1 + amount1Changed) * price0Now;

    return totalAmount0;
  }
}

/**
 * Convert tick number to exact price of token1 per token0 and token0 per token1
 * @returns `price0` - token0 per token1, e.g. 2000 USDC per WETH in USDC/WETH pool
 * @returns `price1` - token1 per token1, e.g. 0.0005 WETH per USDC in USDC/WETH pool
 **/
export function tickToPrice(
  tickIdx: number,
  decimals0: number,
  decimals1: number
) {
  const unNormalizedPrice1 = ONE_TICK.pow(new Decimal(tickIdx));
  const normalizedFactor = TEN.pow(new Decimal(decimals0 - decimals1));

  const price1 = unNormalizedPrice1.mul(normalizedFactor).toNumber();
  const price0 = 1 / price1;

  return {
    price0,
    price1,
  };
}

/**
 * Calculates tick given sqrtPriceX96
 **/
export function sqrtPX96ToTick(sqrtPX96: bigint) {
  const sqrtP = new Decimal(sqrtPX96.toString());
  const tickPrice = sqrtP.div(Q96);
  return tickPrice.log(1.0001).times(2).round().toNumber();
}

/**
 * Convert exact token amount to amount * 10^decimals
 **/
export function stripDecimals(amount: number, decimals: number) {
  return new Decimal(amount).mul(TEN.pow(decimals));
}

/**
 * Convert amount * 10^decimals to exact token amount
 **/
export function applyDecimals(amountRaw: Decimal, decimals: number) {
  return amountRaw.div(TEN.pow(decimals)).toNumber();
}
