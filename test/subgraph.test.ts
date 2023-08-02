import { assert } from "chai";
import { describe, test } from "mocha";
import { getPoolTick, getPoolState, getPoolSwaps } from "../src/subgraph.js";

describe("Test SubGraph queries", async () => {
  const BLOCK = 17593300;
  const TICK = 201011;
  const POOL: `0x${string}` = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"; // USDC-WETH-0.05%

  test("get pool current ticks and token decimals", async function () {
    const tick = await getPoolTick(POOL, BLOCK);
    assert.equal(tick, 201011);
  });

  test("get pool states", async function (this) {
    this.timeout(5000);
    const result = await getPoolState(POOL, BLOCK, {
      tick: TICK,
      lowerBound: -20,
      upperBound: 20,
    });
    assert.approximately(result.token0Price, 1864.767, 0.001);
    assert.approximately(result.token1Price, 0.000536, 0.000001);
    assert.approximately(result.volumeToken0, 383758490807.667, 0.001);
    assert.approximately(result.volumeToken1, 184831100.523683, 0.000001);
    assert.equal(result.tick, 201011);
    assert.equal(result.liquidity, BigInt("25644347264742834619"));
    assert.deepEqual(result.ticks, [
      {
        tickIdx: 201000,
        liquidityGross: BigInt("34158139160655377"),
        liquidityNet: BigInt("34078984097905235"),
      },
      {
        tickIdx: 201010,
        liquidityGross: BigInt("191988064761683015"),
        liquidityNet: BigInt("-176685128548466329"),
      },
      {
        tickIdx: 201020,
        liquidityGross: BigInt("17553750124684126"),
        liquidityNet: BigInt("-17527251614786158"),
      },
      {
        tickIdx: 201030,
        liquidityGross: BigInt("8196176273614461"),
        liquidityNet: BigInt("-1336789995980745"),
      },
    ]);
  });

  test("get pool swaps", async function (this) {
    this.timeout(5000);
    const swaps = await getPoolSwaps(POOL, 17593299, 2);
    const EXPECTED_SWAPS = [
      {
        swapId:
          "0x564b7c16d3dd11098bc03399dbe1b08a2862a5e53eb565fa064ac3446a797ce3#5155537",
        tick: 201014,
        amount0: 6199.814759,
        amount1: -3.324083573507335792,
        blockNumber: 17593299,
        gasETH: 0.02018356025389982,
      },
      {
        swapId:
          "0x8e8aa3eea7c9c845e492afb4b1ef0d4a10121eb24ebf5e5c6ad98052c4eedc30#5155538",
        tick: 201014,
        amount0: -743.541481,
        amount1: 0.399053098140152183,
        blockNumber: 17593299,
        gasETH: 0.030044693380815855,
      },
      {
        swapId:
          "0xffb3ce96f6b1ec8d70e63ee6cfdec9f0a988ba2a1436c10f6e197899d0eb674f#5155539",
        tick: 201014,
        amount0: -5068.052904,
        amount1: 2.72,
        blockNumber: 17593299,
        gasETH: 0.014171584117677294,
      },
      {
        swapId:
          "0x6608bbade7bcf00291810f4ca4cecea6441a515c80f2ab894161c313684693a8#5155540",
        tick: 201011,
        amount0: 174965.702313,
        amount1: -93.794999426765483541,
        blockNumber: 17593300,
        gasETH: 0.0169502191092,
      },
    ];
    assert.deepEqual(swaps, EXPECTED_SWAPS);
  });
});
