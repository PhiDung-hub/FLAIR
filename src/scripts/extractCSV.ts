import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import csv from "fast-csv";
import { createFolderIfNotExists } from "../helpers/scripts_common.js";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function exportToCSV(schema: string) {
  let data!: any;
  let outputFilename!: string;
  switch (schema) {
    case "Block":
      data = await prisma.block.findMany();
      outputFilename = "Block.csv";
      break;
    case "Pool":
      data = await prisma.pool.findMany();
      outputFilename = "Pool.csv";
      break;
    case "PoolData":
      data = await prisma.poolData.findMany();
      outputFilename = "PoolData.csv";
      break;
    case "TickData":
      data = await prisma.tickData.findMany();
      outputFilename = "TickData.csv";
      break;
    case "SwapData":
      data = await prisma.swapData.findMany();
      outputFilename = "SwapData.csv";
      break;
    default:
      console.info(`Invalid schema name: '${schema}'`);
      return;
  }
  try {
    const csvStream = csv.format({ headers: true });
    const outputFolder = "csv";
    createFolderIfNotExists(outputFolder);
    const writableStream = fs.createWriteStream(
      `${outputFolder}/${outputFilename}`
    );

    csvStream.pipe(writableStream);

    for (const row of data) {
      csvStream.write(row);
    }

    csvStream.end();
    console.log("CSV file generated successfully!");
  } catch (error) {
    console.error("Error exporting to CSV:", error);
  } finally {
    await prisma.$disconnect();
  }
}

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
  for (const schema of schemas) {
    await exportToCSV(schema);
  }
}
main();
