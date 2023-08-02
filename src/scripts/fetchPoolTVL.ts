import { MultiBar, Presets } from "cli-progress";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import { getPoolTVL } from "../subgraph.js";
import {
  retrievePool,
  retrieveSwapsWithinRange,
  updatePoolTVL,
} from "../stores.js";
import { LQTY, USDC, WETH } from "../helpers/constants.js";

const multibar = new MultiBar({
  format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
  hideCursor: false,
  clearOnComplete: false,
});

export async function storePoolData(
  poolAddress: `0x${string}`,
  fromBlock: number,
  toBlock: number,
  batchSize = 500
) {
  if (fromBlock > toBlock) {
    throw new Error("Invalid block range input, 'fromBlock' > 'toBlock'");
  }

  const dirtyBlocks = await retrieveSwapsWithinRange({
    poolAddress,
    fromBlock,
    toBlock,
  }).then((swaps) => {
    const s = new Set<number>();
    swaps.forEach(({ blockNumber }) => {
      s.add(blockNumber);
    });
    return s;
  });

  const progressBarTasks = multibar.create(dirtyBlocks.size, 0, {
    ...Presets.shades_grey,
  });

  type IndexedPoolState = Awaited<ReturnType<typeof getPoolTVL>> & {
    block: number;
  };
  const storeTVLStates = async (states: IndexedPoolState[]) => {
    const orderedStates = states.sort((s1, s2) => s1.block - s2.block);

    for (let current_state of orderedStates) {
      await updatePoolTVL(poolAddress, current_state.block, {
        TVLToken0: current_state.TVLToken0,
        TVLToken1: current_state.TVLToken1,
      });

      progressBarTasks.increment();
    }
  };

  let promises = [];
  let batchCounted = 0;
  let processedEntries = 0;
  const totalEntries = dirtyBlocks.size;

  for (const block of dirtyBlocks) {
    promises.push(
      getPoolTVL(poolAddress, block)
        .then((r) => ({ block, ...r }))
        .catch((err) => {
          const msg = `Failed to execute at block ${block}. ${err}`;
          throw new Error(msg);
        })
    );
    processedEntries += 1;

    if (promises.length == batchSize || processedEntries == totalEntries) {
      const states = await Promise.all(promises);
      await storeTVLStates(states);
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
    .help()
    .alias("help", "h")
    .parse();

  const { fromBlock, toBlock } = argv;
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
  console.info(`\nFetching pool TVLs: ${name}`);

  await storePoolData(address as `0x${string}`, fromBlock, toBlock, 1000);
}

main();
