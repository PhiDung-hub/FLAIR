import { assert } from "chai";
import { describe, test } from "mocha";
import { Decimal } from "decimal.js";
import {
  decimalToBigInt,
  tickToPrice,
  stripDecimals,
  applyDecimals,
  getDelta0,
  getDelta1,
  getLiquidityFromDelta0,
  getLiquidityFromDelta1,
  sqrtPX96ToTick,
  getActiveTick,
} from "../../src/helpers/v3_math.js";

describe("Convert Decimal.js to BigInt", () => {
  test("normal case", () => {
    const decimal = new Decimal("1_000_000.89");
    const result = decimalToBigInt(decimal);
    assert.equal(result, BigInt("1000001"));
  });

  test("scientific notation", () => {
    const decimal = new Decimal("1.23e+26");
    const result = decimalToBigInt(decimal);
    assert.equal(result, BigInt("123000000000000000000000000"));
  });
});

describe("Prices and decimals", () => {
  test("tickToPrice", () => {
    const { price0, price1 } = tickToPrice(200311, 6, 18);
    assert.approximately(price0, 2000.04, 0.01);
    assert.approximately(price1, 0.0005, 0.000001);
  });

  test("strip token decimals", () => {
    const amount = 1.23;
    const decimals = 8;
    const exact = stripDecimals(amount, decimals);
    assert.ok(exact.eq(new Decimal(123_000_000)));
  });

  test("apply token decimals", () => {
    const amountRaw = new Decimal(123_000_000);
    const decimals = 8;
    const exact = applyDecimals(amountRaw, decimals);
    assert.equal(exact, 1.23);
  });

  test("sqrtPriceX96 to tick", () => {
    const unitX96 = BigInt(2 ** 96);
    assert.equal(sqrtPX96ToTick(unitX96), 0);

    const P50X96 = BigInt(1.0001 ** 50 * 2 ** 96);
    assert.equal(sqrtPX96ToTick(P50X96), 100);

    const P_50X96 = BigInt(1.0001 ** -50 * 2 ** 96);
    assert.equal(sqrtPX96ToTick(P_50X96), -100);
  });
});

describe("Liquidity calculations", () => {
  const LOWER_TICK = 0;
  const UPPER_TICK = 100;
  const LIQUIDITY = BigInt(10 ** 18);
  const EXPECTED_DELTA_0 = new Decimal(4.9872721 * 10 ** 15);
  const EXPECTED_DELTA_1 = new Decimal(5.0122696 * 10 ** 15);

  test("get amount token0 changed given liquidity", () => {
    const delta0_POSITIVE = getDelta0(LIQUIDITY, UPPER_TICK, LOWER_TICK);
    assert.ok(delta0_POSITIVE.gt(0));
    assert.approximately(
      delta0_POSITIVE.sub(EXPECTED_DELTA_0).toNumber(),
      0,
      10 ** 9
    );

    const delta0_NEGATIVE = getDelta0(LIQUIDITY, LOWER_TICK, UPPER_TICK);
    assert.ok(delta0_NEGATIVE.lt(0));
    assert.approximately(
      delta0_NEGATIVE.add(EXPECTED_DELTA_0).toNumber(),
      0,
      10 ** 9
    );
  });

  test("get amount token1 changed given liquidity", () => {
    const delta1_POSITIVE = getDelta1(LIQUIDITY, LOWER_TICK, UPPER_TICK);
    assert.ok(delta1_POSITIVE.gt(0));
    assert.approximately(
      delta1_POSITIVE.sub(EXPECTED_DELTA_1).toNumber(),
      0,
      10 ** 9
    );

    const delta1_NEGATIVE = getDelta1(LIQUIDITY, UPPER_TICK, LOWER_TICK);
    assert.ok(delta1_NEGATIVE.lt(0));
    assert.approximately(
      delta1_NEGATIVE.add(EXPECTED_DELTA_1).toNumber(),
      0,
      10 ** 9
    );
  });

  test("get liquidity given amount token0 changed", () => {
    const liquidity = getLiquidityFromDelta0(
      EXPECTED_DELTA_0,
      UPPER_TICK,
      LOWER_TICK
    );
    assert.approximately(Number(LIQUIDITY - liquidity), 0, 10 ** 12);
  });

  test("get liquidity given amount token1 changed", () => {
    const liquidity = getLiquidityFromDelta1(
      EXPECTED_DELTA_1,
      LOWER_TICK,
      UPPER_TICK
    );
    assert.approximately(Number(LIQUIDITY - liquidity), 0, 10 ** 12);
  });

  test("get pool active tick from current tick", () => {
    const activeTick1 = getActiveTick(1002, 10);
    assert.equal(activeTick1, 1000);
    const activeTick2 = getActiveTick(-1002, 10);
    assert.equal(activeTick2, -1010);
  });
});
