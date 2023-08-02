import {
  computeFLAIR_Estimate,
  computeFLAIR_Exact,
} from "../../flair/index.js";
import { RANGE_LQTY_WETH } from "../../helpers/constants.js";
import { getRangePositions } from "../../subgraph.js";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("toCSV", {
      alias: "o",
      description: "Whether to extract results into CSV format",
      boolean: true,
      default: false,
    })
    .option("mode", {
      alias: "m",
      description: "Which mode to compute flair on",
      string: true,
      default: "block",
    })
    .help()
    .alias("help", "h")
    .parse();

  const { toCSV } = argv;

  const positions = await getRangePositions(RANGE_LQTY_WETH);
  let totalFLAIR = 0;
  let totalFee0 = 0;
  let totalFee1 = 0;

  console.log("Positions count: ", positions.length);
  for (const position of positions) {
    console.log("\nPosition: ", position, "\n");
    const result = await computeFLAIR_Exact(position, toCSV);
    totalFLAIR += result.flair;
    
    totalFee0 += result.fee0;
    totalFee1 += result.fee1;

    console.info("Flair: ", result, "\n");
  }
  console.log("FLAIR total: ", totalFLAIR);
  console.log("Fee0 total: ", totalFee0);
  console.log("Fee1 total: ", totalFee1);
}
main();
