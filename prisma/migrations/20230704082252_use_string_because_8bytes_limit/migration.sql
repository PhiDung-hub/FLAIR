-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TickData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tickIdx" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "liquidityGross" TEXT NOT NULL,
    "liquidityNet" TEXT NOT NULL,
    "liquidityActive" TEXT NOT NULL,
    CONSTRAINT "TickData_poolAddress_blockNumber_fkey" FOREIGN KEY ("poolAddress", "blockNumber") REFERENCES "PoolData" ("poolAddress", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TickData" ("blockNumber", "id", "liquidityActive", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx") SELECT "blockNumber", "id", "liquidityActive", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx" FROM "TickData";
DROP TABLE "TickData";
ALTER TABLE "new_TickData" RENAME TO "TickData";
CREATE UNIQUE INDEX "TickData_tickIdx_blockNumber_poolAddress_key" ON "TickData"("tickIdx", "blockNumber", "poolAddress");
CREATE TABLE "new_PoolData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockNumber" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "tick" INTEGER NOT NULL,
    "liquidity" TEXT NOT NULL,
    "token0Price" REAL NOT NULL,
    "token1Price" REAL NOT NULL,
    "culmulativeVolumeToken0" REAL NOT NULL,
    "culmulativeVolumeToken1" REAL NOT NULL,
    "feesToken0" REAL NOT NULL,
    "feesToken1" REAL NOT NULL,
    CONSTRAINT "PoolData_poolAddress_fkey" FOREIGN KEY ("poolAddress") REFERENCES "Pool" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PoolData" ("blockNumber", "culmulativeVolumeToken0", "culmulativeVolumeToken1", "feesToken0", "feesToken1", "id", "liquidity", "poolAddress", "tick", "token0Price", "token1Price") SELECT "blockNumber", "culmulativeVolumeToken0", "culmulativeVolumeToken1", "feesToken0", "feesToken1", "id", "liquidity", "poolAddress", "tick", "token0Price", "token1Price" FROM "PoolData";
DROP TABLE "PoolData";
ALTER TABLE "new_PoolData" RENAME TO "PoolData";
CREATE UNIQUE INDEX "PoolData_blockNumber_poolAddress_key" ON "PoolData"("blockNumber", "poolAddress");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
