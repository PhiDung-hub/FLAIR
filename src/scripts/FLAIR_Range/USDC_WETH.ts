import { computeFLAIR_Exact } from "../../flair/index.js";
import { RANGE_USDC_WETH } from "../../helpers/constants.js";
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
    .help()
    .alias("help", "h")
    .parse();

  const { toCSV } = argv;

  const positions = await getRangePositions(RANGE_USDC_WETH);
  console.log("Positions count: ", positions.length);
  let totalFLAIR = 0;
  for (const position of positions) {
    console.log("\nPosition: ", position, "\n");
    const result = await computeFLAIR_Exact(position, toCSV);
    totalFLAIR += result.flair;
    console.info("Flair: ", result, "\n");
  }
  console.log("FLAIR total: ", totalFLAIR);
}
main();
