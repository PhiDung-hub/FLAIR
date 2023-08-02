import { assert } from "chai";
import { describe, test } from "mocha";
import { processAllTicks } from "../../src/helpers/tickProcessing.js";

test("Ticks processing", () => {
  const EXAMPLE_TICKS = [
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
  ];
  const LIQUIDITY = BigInt("25644347264742834619");
  const ACTIVE_TICK = {
    ...EXAMPLE_TICKS[1],
    liquidityActive: LIQUIDITY,
  };
  const EXPECTED_RESULTS = [
    {
      liquidityActive: LIQUIDITY - BigInt("-176685128548466329"),
      tickIdx: 201000,
      liquidityNet: BigInt("34078984097905235"),
      liquidityGross: BigInt("34158139160655377"),
    },
    {
      liquidityActive: LIQUIDITY,
      tickIdx: 201010,
      liquidityNet: BigInt("-176685128548466329"),
      liquidityGross: BigInt("191988064761683015"),
    },
    {
      liquidityActive: LIQUIDITY + BigInt("-17527251614786158"),
      tickIdx: 201020,
      liquidityNet: BigInt("-17527251614786158"),
      liquidityGross: BigInt("17553750124684126"),
    },
    {
      liquidityActive:
        LIQUIDITY + BigInt("-17527251614786158") + BigInt("-1336789995980745"),
      tickIdx: 201030,
      liquidityNet: BigInt("-1336789995980745"),
      liquidityGross: BigInt("8196176273614461"),
    },
  ];
  const processedTicks = processAllTicks(ACTIVE_TICK, EXAMPLE_TICKS, 10);
  assert.deepEqual(processedTicks, EXPECTED_RESULTS);
});
