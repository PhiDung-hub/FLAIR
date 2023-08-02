export { getExactFeeShare } from "./exact.js";
export { getFeeShareEstimated as estimateFeeShare } from "./estimate.js";

import { getExactFeeShare } from "./exact.js";

import { MultiBar, Presets } from "cli-progress";
import fs from "fs";
import csv from "fast-csv";

import { PositionInfo } from "../position.js";
import {
  assertRetrievePool,
  retrieveTicksData,
  retrieveSwapsWithinRange,
  retrieveAllPoolData,
  retrieveAllTicksData,
} from "../stores.js";
import { computePositionValue } from "../helpers/v3_math.js";
import { createFolderIfNotExists } from "../helpers/scripts_common.js";
import { getFeeShareEstimated } from "./estimate.js";
import { LAST_INDEXED_BLOCK } from "../helpers/constants.js";

const multibar = new MultiBar({
  format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
});

interface FeeEstimatorInterface {
  (
    ticks: Awaited<ReturnType<typeof retrieveTicksData>>,
    swaps: Awaited<ReturnType<typeof retrieveSwapsWithinRange>>,
    position: PositionInfo,
    tickSpacing: number
  ): { feeShare0: number; feeShare1: number };
}
export type ToCSVSpec =
  | {
      outputFolder: string;
      fileName?: string;
    }
  | boolean;

export async function computeFLAIR(
  position: PositionInfo,
  feeShareEstimator: FeeEstimatorInterface,
  toCSV: ToCSVSpec = false,
  BATCH_SIZE = 2000
) {
  const { poolAddress } = position;
  const { tickSpacing } = await assertRetrievePool({
    address: poolAddress,
  });

  let FLAIR = 0;
  let totalFee0 = 0;
  let poolFee0 = 0;
  let totalFee1 = 0;
  let poolFee1 = 0;

  const endBlock = Math.min(position.period.toBlock, LAST_INDEXED_BLOCK);
  const startBlock = position.period.fromBlock;
  if (startBlock > endBlock) {
    console.info("NO DATA");
    return {
      flair: 0,
      fee0: 0,
      fee1: 0,
      poolFee0: 0,
      poolFee1: 0,
    };
  }

  const dirtyBlocks = new Set<number>();
  const allSwaps = await retrieveSwapsWithinRange({
    poolAddress,
    fromBlock: startBlock,
    toBlock: endBlock,
  });

  allSwaps.forEach(({ blockNumber }) => {
    dirtyBlocks.add(blockNumber);
  });

  const orderedDirtyBlocks = [...dirtyBlocks];
  orderedDirtyBlocks.sort();

  const progressBar = multibar.create(orderedDirtyBlocks.length, 0, {
    ...Presets.shades_grey,
  });

  let csvStream = null;
  if (toCSV) {
    let outputFolder: string, fileName: string;
    const defaultFileName = `${startBlock}_${endBlock}_${position.liquidity.toString()}.csv`;

    if (toCSV instanceof Object) {
      outputFolder = toCSV.outputFolder;
      fileName = toCSV.fileName ? toCSV.fileName : defaultFileName;
    } else {
      outputFolder = `csv/flair/${poolAddress}`;
      fileName = defaultFileName;
    }
    createFolderIfNotExists(outputFolder);
    csvStream = csv.format({ headers: true });
    const writableStream = fs.createWriteStream(`${outputFolder}/${fileName}`);
    console.info("Writing flair results to: ", `${outputFolder}/${fileName}`);

    csvStream.pipe(writableStream);
  }

  const poolDataMap: Map<
    number,
    {
      tick: number;
      feesToken0: number;
      feesToken1: number;
      token0Price: number;
    }
  > = new Map();
  let allTicksData!: Awaited<ReturnType<typeof retrieveAllTicksData>>;

  let count = 0;
  for (const [index, blockNumber] of orderedDirtyBlocks.entries()) {
    if (count % BATCH_SIZE == 0) {
      const fromBlock = blockNumber;
      const toIndex =
        index + BATCH_SIZE <= orderedDirtyBlocks.length
          ? index + BATCH_SIZE
          : orderedDirtyBlocks.length - 1;
      const toBlock = orderedDirtyBlocks[toIndex];

      poolDataMap.clear();
      const allPoolData = await retrieveAllPoolData(
        poolAddress,
        fromBlock,
        toBlock
      );
      allPoolData.forEach((data) => {
        const { blockNumber, tick, feesToken0, feesToken1, token0Price } = data;
        poolDataMap.set(blockNumber, {
          tick,
          feesToken0,
          feesToken1,
          token0Price,
        });
      });
      allTicksData = await retrieveAllTicksData(
        poolAddress,
        fromBlock,
        toBlock
      );
    }
    count += 1;
    const swaps = allSwaps.filter((swap) => swap.blockNumber === blockNumber);

    const poolData = poolDataMap.get(blockNumber);
    if (!poolData) {
      const msg = `Pool data collection error: No data at block ${blockNumber}`;
      throw new Error(msg);
    }
    const { tick, feesToken0, feesToken1, token0Price } = poolData;

    const ticks = allTicksData.filter((t) => t.blockNumber == blockNumber);
    ticks.sort((t1, t2) => t1.tickIdx - t2.tickIdx);

    const { feeShare0, feeShare1 } = feeShareEstimator(
      ticks,
      swaps,
      position,
      tickSpacing
    );
    // console.info(`Fee share ${feeShareRatio} at block ${blockNumber}`);

    totalFee0 += feesToken0 * feeShare0;
    totalFee1 += feesToken1 * feeShare1;
    poolFee0 += feesToken0;
    poolFee1 += feesToken1;

    // Calculate position value in token0
    const instantaneousFee0 =
      feesToken0 * feeShare0 + feesToken1 * feeShare1 * token0Price;
    const positionValue = computePositionValue(position, tick);
    const dt = 12; // constant since The Merge
    FLAIR += (dt * instantaneousFee0) / positionValue;
    // console.info(`FLAIR ${FLAIR} at block ${blockNumber}`);

    progressBar.increment();
    if (csvStream) {
      csvStream.write({
        flair: FLAIR,
        totalFee0,
        totalFee1,
        poolFee0,
        poolFee1,
        blockNumber,
        positionValueToken0: positionValue,
        ETHPrice: token0Price,
      });
    }
  }

  multibar.stop();
  return {
    flair: FLAIR,
    fee0: totalFee0,
    fee1: totalFee1,
    poolFee0,
    poolFee1,
  };
}

/**
 * Compute FLAIR without any approximattion, requires all swaps data within the period.
 * */
export async function computeFLAIR_Exact(
  position: PositionInfo,
  toCSV: ToCSVSpec = false
) {
  return computeFLAIR(position, getExactFeeShare, toCSV);
}

/**
 * Compute FLAIR without any approximattion, requires all swaps data within the period.
 * */
export async function computeFLAIR_Estimate(
  position: PositionInfo,
  toCSV: ToCSVSpec = false
) {
  return computeFLAIR(position, getFeeShareEstimated, toCSV);
}
