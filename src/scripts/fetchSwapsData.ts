import { MultiBar, Presets } from "cli-progress";

import { cacheSwapData, retrievePool } from "../stores.js";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { getPoolSwaps } from "../subgraph.js";
import { LQTY, USDC, WETH } from "../helpers/constants.js";

const multibar = new MultiBar({
  format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
  hideCursor: false,
  clearOnComplete: false,
});

async function storeSwapsData(
  targetPool: `0x${string}`,
  fromBlock: number,
  toBlock: number,
  blockStep = 5,
  batchSize = 30
) {
  const TASK_NUMBER = toBlock - fromBlock + 1;
  const progressBar = multibar.create(TASK_NUMBER, 0, {
    ...Presets.shades_grey,
  });

  let promises = [];
  for (
    let blockNumber = fromBlock;
    blockNumber <= toBlock;
    blockNumber += blockStep
  ) {
    const storeSwaps = async (blockNumber: number) => {
      const swaps = await getPoolSwaps(targetPool, blockNumber, blockStep);
      for (const swap of swaps) {
        await cacheSwapData({ poolAddress: targetPool, ...swap });
      }
      progressBar.increment(blockStep);
    };
    promises.push(storeSwaps(blockNumber));
    if (promises.length == batchSize || blockNumber == toBlock) {
      await Promise.all(promises);
      promises = [];
    }
  }
  multibar.stop();
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("fromBlock", {
      alias: "f",
      description: "Block to start collecting data",
      default: 17590000,
      number: true,
    })
    .option("toBlock", {
      alias: "t",
      description: "Block to end collecting data",
      default: 17593300,
      number: true,
    })
    .help()
    .alias("help", "h")
    .parse();

  const { fromBlock, toBlock } = argv;
  const targetPool = await retrievePool({
    token0: USDC,
    feeTier: 500,
    // token0: LQTY,
    // feeTier: 3000,
    token1: WETH,
  });
  if (!targetPool) {
    throw new Error("Pool is not initialized");
  }
  const { address, name } = targetPool;

  console.info(`\nFetching swaps data for pool: ${name}\n`);
  await storeSwapsData(address as `0x${string}`, fromBlock, toBlock, 200);
}

main();
