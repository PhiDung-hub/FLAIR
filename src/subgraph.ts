import { request, gql } from "graphql-request";
import { RANGE_SUBGRAPH, V3_SUBGRAPH } from "./helpers/constants.js";
import { Decimal } from "decimal.js";
import {
  applyDecimals,
  getLiquidityFromDelta1,
  sqrtPX96ToTick,
} from "./helpers/v3_math.js";
import { PositionInfo } from "./position.js";
import { assertRetrievePool } from "./stores.js";

///////////////// UNISWAP V3 ///////////////////
// NOTE: Subgraph TVL hot-fix: https://github.com/Uniswap/v3-info/blob/master/src/data/pools/poolData.ts#L197
const TICK_QUERY = gql`
  query GetTickAndDecimal($id: String!, $blockNumber: Int!) {
    pool(id: $id, block: { number: $blockNumber }) {
      tick
    }
  }
`;
export async function getPoolTick(
  poolAddress: `0x${string}`,
  blockNumber: number
) {
  return request<{
    pool: {
      tick: string;
    };
  }>(V3_SUBGRAPH, TICK_QUERY, {
    id: poolAddress,
    blockNumber,
  })
    .then((result) => Number(result.pool.tick))
    .catch((err) => {
      const msg = `Failed to execute at block ${blockNumber}. ${err}`;
      throw new Error(msg);
    });
}

const TVL_QUERY = gql`
  query QueryPoolTVL($id: String!, $blockNumber: Int!) {
    pool(id: $id, block: { number: $blockNumber }) {
      volumeToken0
      volumeToken1
      totalValueLockedToken0
      totalValueLockedToken1
      feeTier
    }
  }
`;
interface TVLResult {
  pool: {
    volumeToken0: string;
    volumeToken1: string;
    totalValueLockedToken0: string;
    totalValueLockedToken1: string;
    feeTier: string;
  };
}
export async function getPoolTVL(
  poolAddress: `0x${string}`,
  blockNumber: number
) {
  return request<TVLResult>(V3_SUBGRAPH, TVL_QUERY, {
    id: poolAddress,
    blockNumber,
  }).then((result) => {
    const {
      feeTier,
      volumeToken0,
      volumeToken1,
      totalValueLockedToken0,
      totalValueLockedToken1,
    } = result.pool;

    const fee = Number(feeTier);
    const volume0 = Number(volumeToken0);
    const volume1 = Number(volumeToken1);
    const tvl0 = Number(totalValueLockedToken0);
    const tvl1 = Number(totalValueLockedToken1);

    const TVLToken0 = tvl0 - ((fee / 10000 / 100) * volume0) / 2;
    const TVLToken1 = tvl1 - ((fee / 10000 / 100) * volume1) / 2;

    return {
      TVLToken0,
      TVLToken1,
    };
  });
}

const POOL_STATE_QUERY = gql`
  query GetPoolState(
    $id: String!
    $blockNumber: Int!
    $lowerTick: Int!
    $upperTick: Int!
  ) {
    pool(id: $id, block: { number: $blockNumber }) {
      volumeToken0
      volumeToken1
      token0Price # token0 per token1
      token1Price # token1 per token0
      liquidity
      tick
      # NOTE: only fetch initialized Ticks
      ticks(
        orderBy: tickIdx
        orderDirection: asc
        first: 300
        where: { tickIdx_gte: $lowerTick, tickIdx_lte: $upperTick }
      ) {
        tickIdx
        liquidityNet
        liquidityGross
      }
    }
  }
`;
interface PoolStateResult {
  pool: {
    volumeToken0: string;
    volumeToken1: string;
    token0Price: string;
    token1Price: string;
    tick: string;
    liquidity: string;
    ticks: {
      tickIdx: string;
      liquidityNet: string;
      liquidityGross: string;
    }[];
  };
}

export async function getPoolState(
  poolAddress: `0x${string}`,
  blockNumber: number,
  {
    tick,
    lowerBound,
    upperBound,
  }: {
    tick: number;
    lowerBound: number;
    upperBound: number;
  }
) {
  if (lowerBound > upperBound) {
    const msg = `Invalid bounds, SHOULD SATISFY: upperBound (${upperBound}) > lowerBound (${lowerBound})`;
    throw new Error(msg);
  }
  const lowerTick = tick + lowerBound;
  const upperTick = tick + upperBound;
  return request<PoolStateResult>(V3_SUBGRAPH, POOL_STATE_QUERY, {
    id: poolAddress,
    blockNumber,
    lowerTick,
    upperTick,
  }).then((result) => {
    const pool = result.pool;
    const ticks = pool.ticks
      .map((tick) => ({
        tickIdx: Number(tick.tickIdx),
        liquidityNet: BigInt(tick.liquidityNet),
        liquidityGross: BigInt(tick.liquidityGross),
      }))
      .sort((tick1, tick2) => tick1.tickIdx - tick2.tickIdx);

    return {
      token0Price: Number(pool.token0Price),
      token1Price: Number(pool.token1Price),
      volumeToken0: Number(pool.volumeToken0),
      volumeToken1: Number(pool.volumeToken1),
      liquidity: BigInt(pool.liquidity),
      tick: Number(pool.tick),
      ticks,
    };
  });
}

const POOL_SWAP_QUERY = gql`
  query GetPoolState(
    $id: String!
    $fromBlock: Int!
    $toBlock: Int!
    $first: Int!
  ) {
    pool(id: $id) {
      swaps(
        where: {
          transaction_: {
            blockNumber_gte: $fromBlock
            blockNumber_lte: $toBlock
          }
        }
        first: $first
      ) {
        id
        tick
        amount0
        amount1
        transaction {
          blockNumber
          timestamp
          gasUsed
          gasPrice
        }
      }
    }
  }
`;
interface PoolSwapsResult {
  pool: {
    swaps: {
      id: string;
      tick: string;
      amount0: string;
      amount1: string;
      transaction: {
        blockNumber: string;
        gasUsed: string;
        gasPrice: string;
      };
    }[];
  };
}

export async function getPoolSwaps(
  poolAddress: `0x${string}`,
  fromBlock: number,
  numBlocks: number
) {
  return internalGetPoolSwaps(
    poolAddress,
    fromBlock,
    fromBlock + numBlocks,
    300
  );
}

async function internalGetPoolSwaps(
  poolAddress: `0x${string}`,
  fromBlock: number,
  toBlock: number,
  first: number
) {
  return request<PoolSwapsResult>(V3_SUBGRAPH, POOL_SWAP_QUERY, {
    id: poolAddress,
    fromBlock,
    toBlock,
    first,
  }).then((result) =>
    result.pool.swaps
      .map((swap) => {
        const { blockNumber, gasUsed, gasPrice } = swap.transaction;
        const gasETH = new Decimal(gasUsed)
          .mul(Number(gasPrice))
          .div(10 ** 18)
          .toNumber();

        return {
          swapId: swap.id,
          tick: Number(swap.tick),
          amount0: Number(swap.amount0),
          amount1: Number(swap.amount1),
          blockNumber: Number(blockNumber),
          gasETH,
        };
      })
      .sort((s1, s2) => s1.blockNumber - s2.blockNumber)
  );
}

const POSITIONS_QUERY = gql`
  query GetPositions($ids: [Int]!, $poolId: String!) {
    positions(where: { id_in: $ids, pool_: { id: $poolId } }) {
      id
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      transaction {
        blockNumber
      }
    }
  }
`;

interface PositionsResult {
  positions: {
    id: string;
    tickLower: {
      tickIdx: string;
    };
    tickUpper: {
      tickIdx: string;
    };
    transaction: {
      blockNumber: string;
    };
  }[];
}

export async function getV3Positions(
  poolAddress: `0x${string}`,
  ids: number[]
) {
  return request<PositionsResult>(V3_SUBGRAPH, POSITIONS_QUERY, {
    ids: ids,
    poolId: poolAddress,
  }).then((result) => {
    return result.positions.map((position) => ({
      id: Number(position.id),
      lowerTick: Number(position.tickLower.tickIdx),
      upperTick: Number(position.tickUpper.tickIdx),
      startAtBlock: Number(position.transaction.blockNumber),
    }));
  });
}

/////////////// END UNISWAP V3 /////////////////

/////////////// RANGE PROTOCOL /////////////////
const RANGE_POSITIONS_QUERY = gql`
  query getRangePositions($vaultAddress: String!) {
    positions(where: { id_contains: $vaultAddress }) {
      id
      openedATBlock
      closedAtBlock
      token0Amount
      token1Amount
      upperTick
      lowerTick
      priceSqrtAtOpening
      vault {
        pool
      }
    }
  }
`;
interface RangePositionsResult {
  positions: {
    id: string;
    openedATBlock: string;
    closedAtBlock: string;
    token0Amount: string;
    token1Amount: string;
    upperTick: string;
    lowerTick: string;
    priceSqrtAtOpening: string;
    vault: {
      pool: `0x${string}`;
    };
  }[];
}

export async function getRangePositions(vaultAddress: `0x${string}`) {
  const rawPositions = await request<RangePositionsResult>(
    RANGE_SUBGRAPH,
    RANGE_POSITIONS_QUERY,
    {
      vaultAddress,
    }
  ).then((results) => {
    return results.positions.map((positionRaw) => {
      const tradeId = Number(positionRaw.id.match(/#(\d+)/)![1]);
      const { openedATBlock, closedAtBlock } = positionRaw;
      const fromBlock = Number(openedATBlock);
      const toBlock = closedAtBlock === "0" ? Infinity : Number(closedAtBlock);
      const startAtTick = sqrtPX96ToTick(
        BigInt(positionRaw.priceSqrtAtOpening)
      );

      return {
        id: tradeId,
        period: {
          fromBlock,
          toBlock,
        },
        rawAmount0: new Decimal(positionRaw.token0Amount),
        rawAmount1: new Decimal(positionRaw.token1Amount),
        poolAddress: positionRaw.vault.pool,
        startAtTick,
        lowerTick: Number(positionRaw.lowerTick),
        upperTick: Number(positionRaw.upperTick),
      };
    });
  });

  type RawPosition = (typeof rawPositions)[number];
  const processPosition = async (
    position: RawPosition
  ): Promise<PositionInfo> => {
    const { rawAmount0, rawAmount1, ...rest } = position;
    const { decimals0, decimals1 } = await assertRetrievePool({
      address: position.poolAddress,
    });

    const amount0 = applyDecimals(rawAmount0, decimals0);
    const amount1 = applyDecimals(rawAmount1, decimals1);
    const liquidity = getLiquidityFromDelta1(
      rawAmount1,
      position.startAtTick,
      position.upperTick
    );

    return {
      amount0,
      amount1,
      decimals0,
      decimals1,
      liquidity,
      ...rest,
    };
  };

  const promises: ReturnType<typeof processPosition>[] = [];
  rawPositions.forEach((position) => {
    promises.push(processPosition(position));
  });

  return Promise.all(promises);
}

/////////////// END RANGE PROTOCOL /////////////
