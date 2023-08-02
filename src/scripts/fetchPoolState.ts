import { MultiBar, Presets } from "cli-progress";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import { getPoolState, getPoolTick } from "../subgraph.js";
import {
  cachePoolData,
  cacheTickData,
  retrievePool,
  assertRetrievePool,
  retrieveSwapsWithinRange,
} from "../stores.js";
import { LQTY, USDC, WETH } from "../helpers/constants.js";
import { processAllTicks } from "../helpers/tickProcessing.js";
import { getActiveTick } from "../helpers/v3_math.js";

const multibar = new MultiBar({
  format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
  hideCursor: false,
  clearOnComplete: false,
});

export async function storePoolData(
  poolAddress: `0x${string}`,
  fromBlock: number,
  toBlock: number,
  lowerRange: number,
  upperRange: number
) {
  if (fromBlock > toBlock) {
    throw new Error("Invalid block range input, 'fromBlock' > 'toBlock'");
  }

  const { tickSpacing, feeTier } = await assertRetrievePool({
    address: poolAddress,
  });

  const allSwaps = await retrieveSwapsWithinRange({
    poolAddress,
    fromBlock,
    toBlock,
  }).then((swaps) => {
    const swapsData: { [key: number]: [number, number, number][] } = {};
    swaps.forEach(({ blockNumber, tick, amount0, amount1 }) => {
      if (!swapsData[blockNumber]) {
        swapsData[blockNumber] = [];
      }
      swapsData[blockNumber].push([tick, amount0, amount1]);
    });
    return swapsData;
  });

  const progressBarTasks = multibar.create(Object.keys(allSwaps).length, 0, {
    ...Presets.shades_grey,
  });

  type IndexedPoolState = Awaited<ReturnType<typeof getPoolState>> & {
    block: number;
    fee0: number;
    fee1: number;
  };
  const processThenStoreStates = async (states: IndexedPoolState[]) => {
    const orderedStates = states.sort((s1, s2) => s1.block - s2.block);

    for (let current_state of orderedStates) {
      // @ts-ignore
      await cachePoolData({
        blockNumber: current_state.block,
        poolAddress,
        tick: current_state.tick,
        token0Price: current_state.token0Price,
        token1Price: current_state.token1Price,
        liquidity: current_state.liquidity.toString(),
        culmulativeVolumeToken0: current_state.volumeToken0,
        culmulativeVolumeToken1: current_state.volumeToken1,
        feesToken0: current_state.fee0,
        feesToken1: current_state.fee1,
      });

      const activeTickIdx = getActiveTick(current_state.tick, tickSpacing);
      const activeTickProcessed = {
        liquidityActive: current_state.liquidity,
        tickIdx: activeTickIdx,
        liquidityNet: 0n,
        liquidityGross: 0n,
      };

      const activeTick = current_state.ticks.findLast(
        (t) => t.tickIdx == activeTickIdx
      );
      if (activeTick) {
        activeTickProcessed.liquidityGross = activeTick.liquidityGross;
        activeTickProcessed.liquidityNet = activeTick.liquidityNet;
      }

      const processedTicks = processAllTicks(
        activeTickProcessed,
        current_state.ticks,
        tickSpacing
      );

      for (const t of processedTicks) {
        await cacheTickData({
          blockNumber: current_state.block,
          poolAddress,
          tickIdx: t.tickIdx,
          liquidityActive: t.liquidityActive.toString(),
          liquidityGross: t.liquidityGross.toString(),
          liquidityNet: t.liquidityNet.toString(),
        });
      }

      progressBarTasks.increment();
    }
  };

  const getTickRangeThenPoolState = async (
    block: number,
    ticks: number[],
    fee0: number,
    fee1: number
  ) => {
    const tick = await getPoolTick(poolAddress, block);
    const minActiveTick = getActiveTick(Math.min(...ticks), tickSpacing);
    const maxActiveTick = getActiveTick(Math.max(...ticks), tickSpacing);
    const activeTick = getActiveTick(tick, tickSpacing);
    const lowerBound = Math.min(
      -lowerRange * tickSpacing,
      minActiveTick - activeTick - lowerRange * tickSpacing
    );
    const upperBound = Math.max(
      upperRange * tickSpacing,
      maxActiveTick - activeTick + upperRange * tickSpacing
    );
    return getPoolState(poolAddress, block, {
      tick,
      lowerBound,
      upperBound,
    })
      .then((state) => {
        return {
          block,
          fee0,
          fee1,
          ...state,
        };
      })
      .catch((err) => {
        const msg = `Failed to execute at block ${block}. ${err}`;
        throw new Error(msg);
      });
  };

  const batchSize = 200;
  let promises = [];
  let batchCounted = 0;
  let processedEntries = 0;
  const totalEntries = Object.entries(allSwaps).length;

  for (const [blockNumber, blockInfo] of Object.entries(allSwaps)) {
    const block = Number(blockNumber);
    const ticks = blockInfo.map((i) => i[0]);

    // WARNING: might overflow, but impossible at current network volume.
    let fee0 = 0;
    let fee1 = 0;
    blockInfo.forEach((info) => {
      const amount0 = info[1];
      const amount1 = info[2];
      if (amount0 > 0) {
        fee0 += (amount0 * feeTier) / 1e6;
      } else {
        fee1 += (amount1 * feeTier) / 1e6;
      }
    });

    promises.push(getTickRangeThenPoolState(block, ticks, fee0, fee1));
    processedEntries += 1;

    if (promises.length == batchSize || processedEntries == totalEntries) {
      const states = await Promise.all(promises);
      await processThenStoreStates(states);
      promises = [];
      batchCounted += 1;
    }
  }

  multibar.stop();
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("fromBlock", {
      alias: "f",
      description: "Block to start collecting data",
      number: true,
      default: 17590000,
    })
    .option("toBlock", {
      alias: "t",
      description: "Block to end collecting data",
      number: true,
      default: 17593300,
    })
    .option("lowerRange", {
      alias: "l",
      description: "lower bound to collect surrounding tick data",
      number: true,
      default: 2,
    })
    .option("upperRange", {
      alias: "u",
      description: "upper bound to collect surrounding tick data",
      number: true,
      default: 2,
    })
    .help()
    .alias("help", "h")
    .parse();

  const { fromBlock, toBlock, lowerRange, upperRange } = argv;
  const targetPool = await retrievePool({
    token1: WETH,
    // token0: USDC,
    // feeTier: 500,
    token0: LQTY,
    feeTier: 3000,
  });
  if (!targetPool) {
    throw new Error("Pool is not initialized");
  }
  const { address, name } = targetPool;
  console.info(`\nFetching pool state and ticks data for pool: ${name}`);

  await storePoolData(
    address as `0x${string}`,
    fromBlock,
    toBlock,
    lowerRange,
    upperRange
  );
}

main();
