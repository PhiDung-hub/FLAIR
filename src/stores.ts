import {
  PrismaClient,
  Pool,
  PoolData,
  TickData,
  SwapData,
  Block,
} from "@prisma/client";

const prisma = new PrismaClient();

/////////////////// CACHE /////////////////
export async function cacheBlock({ blockNumber, timeStamp }: Block) {
  return prisma.block.upsert({
    where: {
      blockNumber,
    },
    create: {
      blockNumber,
      timeStamp,
    },
    update: {
      blockNumber,
      timeStamp,
    },
  });
}
type PoolProps = Omit<Pool, "id">;
export async function cachePool(poolProps: PoolProps) {
  return prisma.pool.upsert({
    where: { address: poolProps.address },
    create: {
      ...poolProps,
    },
    update: {
      ...poolProps,
    },
  });
}

type PoolDataProps = Omit<PoolData, "id">;
export async function cachePoolData(poolData: PoolDataProps) {
  return prisma.poolData.upsert({
    where: {
      blockNumber_poolAddress: {
        blockNumber: poolData.blockNumber,
        poolAddress: poolData.poolAddress,
      },
    },
    create: {
      ...poolData,
    },
    update: {
      ...poolData,
    },
  });
}

export async function updatePoolTVL(
  poolAddress: `0x${string}`,
  blockNumber: number,
  { TVLToken0, TVLToken1 }: { TVLToken0: number; TVLToken1: number }
) {
  return prisma.poolData.update({
    where: {
      blockNumber_poolAddress: {
        blockNumber,
        poolAddress,
      },
    },
    data: {
      TVLToken0,
      TVLToken1,
    },
  });
}

type TickDataProps = Omit<TickData, "id">;
export async function cacheTickData(tickData: TickDataProps) {
  return prisma.tickData.upsert({
    where: {
      tickIdx_blockNumber_poolAddress: {
        tickIdx: tickData.tickIdx,
        blockNumber: tickData.blockNumber,
        poolAddress: tickData.poolAddress,
      },
    },
    create: {
      ...tickData,
    },
    update: {
      ...tickData,
    },
  });
}

type SwapDataProps = Omit<SwapData, "id">;
export async function cacheSwapData(swapData: SwapDataProps) {
  return prisma.swapData.upsert({
    where: {
      swapId: swapData.swapId,
    },
    create: {
      ...swapData,
    },
    update: {
      ...swapData,
    },
  });
}
///////////////// END CACHE ////////////////

///////////////// RETRIEVERS ///////////////
export async function retrieveBlock(blockNumber: number) {
  return prisma.block.findUnique({
    where: { blockNumber },
  });
}
export async function assertRetrieveBlock(blockNumber: number) {
  return retrieveBlock(blockNumber).then((block) => {
    if (!block) {
      throw new Error(`Block ${blockNumber} not found`);
    }
    return block;
  });
}

type PoolIdentifier =
  | {
    token0: string;
    token1: string;
    feeTier: number;
  }
  | { address: string };
export async function retrievePool(poolIdentifier: PoolIdentifier) {
  if ("address" in poolIdentifier) {
    return prisma.pool.findUnique({
      where: {
        ...poolIdentifier,
      },
    });
  } else {
    return prisma.pool.findUnique({
      where: {
        token0_token1_feeTier: {
          ...poolIdentifier,
        },
      },
    });
  }
}
export async function assertRetrievePool(poolIdentifier: PoolIdentifier) {
  return retrievePool(poolIdentifier).then((pool) => {
    if (!pool) {
      if ("address" in poolIdentifier) {
        const msg = `Pool ${poolIdentifier.address}  not found`;
        throw new Error(msg);
      } else {
        const msg = `Pool ${poolIdentifier.token0}/${poolIdentifier.token1}-${poolIdentifier.feeTier}  not found`;
        throw new Error(msg);
      }
    }
    return pool;
  });
}

type PoolDataIdentifier = {
  blockNumber: number;
  poolAddress: string;
};
export async function retrievePoolData(poolDataIdentifier: PoolDataIdentifier) {
  return prisma.poolData.findUnique({
    where: {
      blockNumber_poolAddress: { ...poolDataIdentifier },
    },
  });
}
export async function assertRetrievePoolData(
  poolDataIdentifier: PoolDataIdentifier
) {
  return retrievePoolData(poolDataIdentifier).then((poolData) => {
    if (!poolData) {
      const message = `Pool Data: ${poolDataIdentifier.poolAddress} at ${poolDataIdentifier.blockNumber} not found`;
      throw new Error(message);
    }
    return poolData;
  });
}

export async function retrieveAllPoolData(
  poolAddress: `0x${string}`,
  fromBlock: number,
  toBlock: number
) {
  return prisma.poolData
    .findMany({
      where: {
        poolAddress,
        blockNumber: {
          gte: fromBlock,
          lte: toBlock,
        },
      },
    })
    .then((data) => {
      data.sort((e1, e2) => e1.blockNumber - e2.blockNumber);
      return data;
    });
}

type TickDataIdentifier = {
  tickIdx: number;
  blockNumber: number;
  poolAddress: string;
};
export async function retrieveTickData(tickIdentifier: TickDataIdentifier) {
  return prisma.tickData.findUnique({
    where: {
      tickIdx_blockNumber_poolAddress: { ...tickIdentifier },
    },
  });
}

export async function assertRetrieveTickData(
  tickIdentifier: TickDataIdentifier
) {
  return retrieveTickData(tickIdentifier).then((tickData) => {
    if (!tickData) {
      throw new Error(
        `Tick ${tickIdentifier.tickIdx} from pool ${tickIdentifier.poolAddress} at ${tickIdentifier.poolAddress} not found`
      );
    }
    return tickData;
  });
}

export async function retrieveTicksData(
  poolDataIdentifier: PoolDataIdentifier
) {
  return prisma.tickData
    .findMany({
      where: {
        ...poolDataIdentifier,
      },
    })
    .then((result) => {
      result.sort((t1, t2) => t1.tickIdx - t2.tickIdx);
      return result;
    });
}

export async function retrieveAllTicksData(
  poolAddress: string,
  fromBlock: number,
  toBlock: number
) {
  return prisma.tickData
    .findMany({
      where: {
        poolAddress,
        blockNumber: {
          gte: fromBlock,
          lte: toBlock,
        },
      },
    })
    .then((data) => {
      data.sort((e1, e2) => e1.blockNumber - e2.blockNumber);
      return data;
    });
}

export async function retrieveSwapsData({
  poolAddress,
  blockNumber,
}: {
  poolAddress: string;
  blockNumber: number;
}) {
  return prisma.swapData.findMany({
    where: {
      blockNumber,
      poolAddress,
    },
  });
}

export async function retrieveSwapsWithinRange({
  poolAddress,
  fromBlock,
  toBlock,
}: {
  poolAddress: string;
  fromBlock: number;
  toBlock: number;
}) {
  return prisma.swapData.findMany({
    where: {
      poolAddress,
      blockNumber: {
        gte: fromBlock,
        lte: toBlock,
      },
    },
  });
}
///////////////// END RETRIEVERS ///////////////

//////////////////// CLEANERS //////////////////
export async function cleanPoolDataSchema() {
  return prisma.poolData.deleteMany();
}

export async function cleanTickDataSchema() {
  return prisma.tickData.deleteMany();
}

export async function cleanPoolSchema() {
  return prisma.pool.deleteMany();
}

export async function cleanBlockSchema() {
  return prisma.block.deleteMany();
}
///////////////// END CLEANERS /////////////////
