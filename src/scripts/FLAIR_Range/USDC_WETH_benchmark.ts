import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import {
  computeFLAIR_Estimate,
  computeFLAIR_Exact,
} from "../../flair/index.js";
import {
  USDC,
  TOP_USDC_WETH_POSITIONS,
  WETH,
} from "../../helpers/constants.js";
import {
  getBenchmarkPositions,
  processBenchmarkPosition,
} from "../../benchmark.js";
import { assertRetrievePool } from "../../stores.js";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("toCSV", {
      alias: "o",
      description: "Whether to extract results into CSV format",
      boolean: true,
      default: false,
    })
    .help()
    .alias("help", "h")
    .parse();

  const { toCSV } = argv;

  const benchmarkPositions = await getBenchmarkPositions(
    USDC,
    WETH,
    500,
    TOP_USDC_WETH_POSITIONS
  );
  const { address } = await assertRetrievePool({
    token0: USDC,
    token1: WETH,
    feeTier: 500,
  });

  for (const p of benchmarkPositions) {
    const { positions, id } = await processBenchmarkPosition(p);
    let totalFLAIR = 0;
    let totalFee0 = 0;
    let totalFee1 = 0;

    console.log(
      `Processing position tokenId: ${id}. Positions count: ${positions.length}`
    );

    for (const position of positions) {
      let result;
      console.log(position);
      if (toCSV) {
        result = await computeFLAIR_Exact(position, {
          outputFolder: `csv/flair/bench/${address}/${id}/`,
        });
      } else {
        result = await computeFLAIR_Estimate(position);
      }
      console.log(result);

      totalFLAIR += result.flair;
      totalFee0 += result.fee0;
      totalFee1 += result.fee1;
    }
    console.log("FLAIR total: ", totalFLAIR);
    console.log("Fee0 total: ", totalFee0);
    console.log("Fee1 total: ", totalFee1);
    console.log("\n\n");
  }
}

main();
