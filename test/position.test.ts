import { assert } from "chai";
import { describe, test } from "mocha";

import {
  startInRangePosition,
  startOutOfRangePosition,
} from "../src/position.js";

describe("Test Position initialization", async () => {
  const FROM_BLOCK = 17593200;
  const TO_BLOCK = 17593300;
  const PERIOD = { fromBlock: FROM_BLOCK, toBlock: TO_BLOCK };
  const POOL: `0x${string}` = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"; // USDC-WETH-0.05%

  describe("In range positions", function (this) {
    this.timeout(6000);
    test("Use token1 input", async () => {
      const position = await startInRangePosition(PERIOD, POOL, 0, 1, 100);
      assert.equal(position.amount1, 100);
    });

    test("Use token0 input", async () => {
      const position = await startInRangePosition(
        PERIOD,
        POOL,
        0,
        1,
        185_000,
        false
      );
      assert.equal(position.amount0, 185_000);
    });
  });

  describe("Out of range positions", function (this) {
    this.timeout(6000);
    test("Upper Range, should requires token1", async () => {
      const position = await startOutOfRangePosition(PERIOD, POOL, 1, 5, 100);
      assert.equal(position.amount0, 0);
      assert.equal(position.amount1, 100);
    });

    test("Lower Range, should requires token0", async () => {
      const position = await startOutOfRangePosition(
        PERIOD,
        POOL,
        1,
        -5,
        185_000
      );
      assert.equal(position.amount0, 185_000);
      assert.equal(position.amount1, 0);
    });
  });
});
