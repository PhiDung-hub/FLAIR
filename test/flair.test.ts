import { assert } from "chai";
import { describe, test } from "mocha";
import { startInRangePosition } from "../src/position.js";
import { computePositionValue } from "../src/helpers/v3_math.js";

describe("Test ultilities functions for FLAIR calculation", async () => {
  const POOL: `0x${string}` = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"; // USDC-WETH-0.05%
  let POSITION: Awaited<ReturnType<typeof startInRangePosition>>;
  before(async () => {
    // tick
    POSITION = await startInRangePosition(
      {
        fromBlock: 17593300,
        toBlock: 17593301,
      },
      POOL,
      0,
      1,
      100
    );
    console.info(
      `Position: ${POSITION.lowerTick}-${POSITION.upperTick}, token0: ${POSITION.amount0}, token1: ${POSITION.amount1}`
    );
  });
  describe("Calculate position value in token0", () => {
    test("out of range upper should return Infinity", () => {
      const amountToken0 = computePositionValue(POSITION, 20100);
      assert.equal(amountToken0, Infinity);
    });
    test("out of range lower should return Infinity", () => {
      const amountToken0 = computePositionValue(POSITION, 201030);
      assert.equal(amountToken0, Infinity);
    });
    test("in range should return some amount", () => {
      const amountToken0 = computePositionValue(POSITION, 201015);
      console.log("Position value in token0: ", amountToken0);
      assert.ok(amountToken0 > 200_000);
    });
  });
});
