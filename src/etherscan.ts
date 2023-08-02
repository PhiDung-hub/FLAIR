import {
  ETHERSCAN_BASE_URL,
  POSITION_MANAGER,
  V3_INCREASE_LIQUIDITY_SIGNATURE,
  V3_DECREASE_LIQUIDITY_SIGNATURE,
  RANGE_LQTY_WETH,
  V3_MINT_SIGNATURE,
  V3_BURN_SIGNATURE,
} from "./helpers/constants.js";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

const API_KEY = process.env.ETHERSCAN_API_KEY;

function tokenIdToHex(tokenId: number): `0x${string}` {
  const hexValue = parseInt(tokenId.toString()).toString(16).padStart(64, "0");
  return `0x${hexValue}`;
}

const query_INCREASE_LIQUIDITY = (
  tokenId: number,
  { fromBlock, toBlock }: { fromBlock: number; toBlock: number }
) => {
  const tokenIdHex = tokenIdToHex(tokenId);
  const query = `${ETHERSCAN_BASE_URL}/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${POSITION_MANAGER}&topic0=${V3_INCREASE_LIQUIDITY_SIGNATURE}&topic_0_1_opr=and&topic1=${tokenIdHex}&apikey=${API_KEY}`;
  return query;
};

const query_DECREASE_LIQUIDITY = (
  tokenId: number,
  { fromBlock, toBlock }: { fromBlock: number; toBlock: number }
) => {
  const tokenIdHex = tokenIdToHex(tokenId);
  const query = `${ETHERSCAN_BASE_URL}/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${POSITION_MANAGER}&topic0=${V3_DECREASE_LIQUIDITY_SIGNATURE}&topic_0_1_opr=and&topic1=${tokenIdHex}&apikey=${API_KEY}`;
  return query;
};

interface EtherscanLogsResponse {
  status: string;
  message: string;
  result: {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    blockHash: string;
    timeStamp: string;
    gasPrice: string;
    gasUsed: string;
    logIndex: string;
    transactionHash: string;
    transactionIndex: string;
  }[];
}

export async function getPositionLiquidityHistory(
  tokenId: number,
  { fromBlock, toBlock }: { fromBlock: number; toBlock: number }
) {
  const increases = await getPositionLiquidityChanges(
    tokenId,
    { fromBlock, toBlock },
    "increase"
  );
  const decreases = await getPositionLiquidityChanges(
    tokenId,
    { fromBlock, toBlock },
    "decrease"
  );

  const orderedEvents = [...increases, ...decreases];
  orderedEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber);
  return orderedEvents;
}

export async function getPositionLiquidityChanges(
  tokenId: number,
  { fromBlock, toBlock }: { fromBlock: number; toBlock: number },
  type: "increase" | "decrease"
) {
  let query: string;
  if (type === "increase") {
    query = query_INCREASE_LIQUIDITY(tokenId, { fromBlock, toBlock });
  } else {
    query = query_DECREASE_LIQUIDITY(tokenId, { fromBlock, toBlock });
  }

  return fetch(query)
    .then((response) => response.json())
    .then((data: EtherscanLogsResponse) => {
      if (data.status !== "1") {
        return [];
      }
      const events = data.result.map((event) => {
        const blockNumber = Number(event.blockNumber);
        let liquidityDelta = BigInt(`0x${event.data.substring(2, 66)}`);
        if (type === "decrease") {
          liquidityDelta *= BigInt(-1);
        }
        const amount0 = BigInt(`0x${event.data.substring(66, 130)}`);
        const amount1 = BigInt(`0x${event.data.substring(130, 194)}`);

        return {
          blockNumber,
          liquidityDelta,
          amount0,
          amount1,
        };
      });
      return events;
    });
}

function hexString256ToInt24(hexString: string) {
  const int24HexString = hexString.slice(-6);
  return (parseInt(int24HexString, 16) << 8) >> 8;
}

export const query_RANGE_LIQUIDITY_ADDED = (
  poolAddress: `0x${string}`,
  vaultAddress: `0x${string}`,
  {
    fromBlock,
    toBlock,
  }: {
    fromBlock: number;
    toBlock: number;
  }
) => {
  const paddedVaultAddress = `0x${vaultAddress.substring(2).padStart(64, "0")}`;
  return `${ETHERSCAN_BASE_URL}/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${poolAddress}&topic0=${V3_MINT_SIGNATURE}&topic_0_1_opr=and&topic1=${paddedVaultAddress}&apikey=${API_KEY}`;
};

export const query_RANGE_LIQUIDITY_REMOVED = (
  poolAddress: `0x${string}`,
  vaultAddress: `0x${string}`,
  {
    fromBlock,
    toBlock,
  }: {
    fromBlock: number;
    toBlock: number;
  }
) => {
  const paddedVaultAddress = `0x${vaultAddress.substring(2).padStart(64, "0")}`;
  return `${ETHERSCAN_BASE_URL}/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${poolAddress}&topic0=${V3_BURN_SIGNATURE}&topic_0_1_opr=and&topic1=${paddedVaultAddress}&apikey=${API_KEY}`;
};

export async function getVaultLiquidityChanges(
  poolAddress: `0x${string}`,
  vaultAddress: `0x${string}`,
  { fromBlock, toBlock }: { fromBlock: number; toBlock: number },
  type: "increase" | "decrease"
) {
  let query: string;
  if (type === "increase") {
    query = query_RANGE_LIQUIDITY_ADDED(poolAddress, vaultAddress, {
      fromBlock,
      toBlock,
    });
  } else {
    query = query_RANGE_LIQUIDITY_REMOVED(poolAddress, vaultAddress, {
      fromBlock,
      toBlock,
    });
  }

  return fetch(query)
    .then((response) => response.json())
    .then((data: EtherscanLogsResponse) => {
      if (data.status !== "1") {
        console.info(data);
        return [];
      }
      const events = data.result.map((event) => {
        const blockNumber = Number(event.blockNumber);
        let liquidityDelta: bigint, amount0: bigint, amount1: bigint;
        if (type === "decrease") {
          liquidityDelta = -BigInt(`0x${event.data.substring(2, 66)}`);
          amount0 = BigInt(`0x${event.data.substring(66, 130)}`);
          amount1 = BigInt(`0x${event.data.substring(130, 194)}`);
        } else {
          liquidityDelta = BigInt(`0x${event.data.substring(66, 130)}`);
          amount0 = BigInt(`0x${event.data.substring(130, 194)}`);
          amount1 = BigInt(`0x${event.data.substring(194, 258)}`);
        }
        const lowerTick = hexString256ToInt24(event.topics[2]);
        const upperTick = hexString256ToInt24(event.topics[3]);

        return {
          blockNumber,
          liquidityDelta,
          amount0,
          amount1,
          lowerTick,
          upperTick,
        };
      });
      return events;
    });
}

// NOTE: Currently, Range only allows 1 position at a time so this is the same as queries using subgraph
export async function getVaultLiquidityHistory(
  poolAddress: `0x${string}`,
  vaultAddress: `0x${string}`,
  { fromBlock, toBlock }: { fromBlock: number; toBlock: number }
) {
  const increases = await getVaultLiquidityChanges(
    poolAddress,
    vaultAddress,
    { fromBlock, toBlock },
    "increase"
  );
  const decreases = await getVaultLiquidityChanges(
    poolAddress,
    vaultAddress,
    { fromBlock, toBlock },
    "decrease"
  );

  const orderedEvents = [...increases, ...decreases];
  orderedEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber);
  return orderedEvents;
}

async function main() {
  // const events = await getVaultLiquidityHistory(
  //   "0xd1d5a4c0ea98971894772dcd6d2f1dc71083c44e",
  //   RANGE_LQTY_WETH,
  //   {
  //     fromBlock: 17059000,
  //     toBlock: 17648000,
  //   }
  // );
  // console.info(events);
  const events = await getPositionLiquidityHistory(363330, {
    fromBlock: 15059000,
    toBlock: 17648000,
  });
  console.info(events);
}
main();
