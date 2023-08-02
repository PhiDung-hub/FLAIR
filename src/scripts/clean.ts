import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import {
  cleanPoolSchema,
  cleanPoolDataSchema,
  cleanTickDataSchema,
  cleanBlockSchema,
} from "../stores.js";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("schemas", {
      alias: "s",
      description: "Specify one or more schemas to clean",
      array: true,
      demandOption: true,
      requiresArg: true,
      string: true,
    })
    .help()
    .alias("help", "h")
    .parse();

  const schemas: string[] = argv.schemas;
  schemas.forEach(async (schema) => {
    switch (schema) {
      case "PoolData":
        await cleanPoolDataSchema();
        break;
      case "Pool":
        await cleanPoolSchema();
        break;
      case "Block":
        await cleanBlockSchema();
        break;
      case "TickData":
        await cleanTickDataSchema();
        break;
    }
  });
}
main();
