import { MultiBar, Presets } from "cli-progress";

import { getBlockTimestamp } from "../viem_client.js";
import { cacheBlock } from "../stores.js";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const multibar = new MultiBar({
  format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
  hideCursor: false,
  clearOnComplete: false,
});

async function storeBlocksData(
  fromBlock: number,
  toBlock: number,
  batchSize = 100
) {
  const TASK_NUMBER = toBlock - fromBlock + 1;
  const progressBar = multibar.create(TASK_NUMBER, 0, {
    ...Presets.shades_grey,
  });

  let promises = [];
  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    promises.push(
      getBlockTimestamp(blockNumber).then((timeStamp) => {
        progressBar.increment();
        return cacheBlock({ blockNumber, timeStamp });
      })
    );
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
  await storeBlocksData(fromBlock, toBlock);
}

main();
