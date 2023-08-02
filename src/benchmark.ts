import { getPositionLiquidityHistory } from "./etherscan.js";
import { getPoolTick, getV3Positions } from "./subgraph.js";
import { assertRetrievePool } from "./stores.js";
import { PositionInfo } from "./position.js";
import { applyDecimals, getDelta0, getDelta1 } from "./helpers/v3_math.js";
import { USDC, WETH } from "./helpers/constants.js";

export async function getBenchmarkPositions(
  token0: `0x${string}`,
  token1: `0x${string}`,
  feeTier: number,
  ids: number[]
) {
  const { address, decimals0, decimals1 } = await assertRetrievePool({
    token0,
    token1,
    feeTier,
  });
  const rawPositions = await getV3Positions(address as `0x${string}`, ids);

  const endBlock = 17674500;
  let positions = [];
  for (const p of rawPositions) {
    const history = await getPositionLiquidityHistory(p.id, {
      fromBlock: p.startAtBlock,
      toBlock: endBlock,
    });
    // console.log("Positions: ", p, "\nHistory: ", history);
    positions.push({
      ...p,
      history,
      poolAddress: address,
      decimals0,
      decimals1,
    });
  }
  return positions;
}

type ProcessedPosition = {
  id: number;
  positions: PositionInfo[];
};
export async function processBenchmarkPosition(
  benchmarkPosition: Awaited<ReturnType<typeof getBenchmarkPositions>>[number]
): Promise<ProcessedPosition> {
  const { lowerTick, upperTick, decimals0, decimals1 } = benchmarkPosition;
  const poolAddress = benchmarkPosition.poolAddress as `0x${string}`;

  const constructPosition = async (
    fromBlock: number,
    toBlock: number,
    liquidity: bigint
  ): Promise<PositionInfo> => {
    const tick = await getPoolTick(poolAddress, fromBlock);
    let amount0!: number, amount1!: number;

    if (tick < lowerTick) {
      amount1 = 0;
      amount0 = applyDecimals(
        getDelta0(liquidity, upperTick, lowerTick),
        decimals0
      );
    } else if (tick < upperTick) {
      amount0 = applyDecimals(getDelta0(liquidity, tick, lowerTick), decimals0);
      amount1 = applyDecimals(getDelta1(liquidity, tick, upperTick), decimals1);
    } else {
      amount0 = 0;
      amount1 = applyDecimals(
        getDelta1(liquidity, lowerTick, upperTick),
        decimals1
      );
    }

    const newPosition: PositionInfo = {
      period: {
        fromBlock,
        toBlock,
      },
      startAtTick: tick,
      lowerTick,
      upperTick,
      decimals0,
      decimals1,
      amount0,
      amount1,
      poolAddress,
      liquidity,
    };

    return newPosition;
  };

  const positions = [];
  let currentLiquidity = 0n;
  let previousBlock = 0;

  for (const event of benchmarkPosition.history) {
    if (currentLiquidity !== 0n) {
      // NOTE: initialize a position
      const newPosition = await constructPosition(
        previousBlock,
        event.blockNumber,
        currentLiquidity
      );
      positions.push(newPosition);
    }

    currentLiquidity += event.liquidityDelta;
    previousBlock = event.blockNumber;
  }

  // NOTE: Position is still active
  if (currentLiquidity !== 0n) {
    const newPosition = await constructPosition(
      previousBlock,
      Infinity,
      currentLiquidity
    );
    positions.push(newPosition);
  }

  return {
    id: benchmarkPosition.id,
    positions,
  };
}

// async function main() {
//   const benchmarkPositions = await getBenchmarkPositions(USDC, WETH, 500, [
//     250274,
//   ]);
//   for (const p of benchmarkPositions) {
//     const { positions, id } = await processBenchmarkPosition(p);
//     console.log(positions);
//   }
// }
// main();
