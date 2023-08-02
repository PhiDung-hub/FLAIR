/*
  Warnings:

  - You are about to alter the column `feesUSD` on the `PoolData` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `token0Price` on the `PoolData` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `token1Price` on the `PoolData` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `totalValueLockedUSD` on the `PoolData` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `feesUSD` on the `TickData` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PoolData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockNumber" INTEGER NOT NULL,
    "tick" INTEGER NOT NULL,
    "token0Price" REAL NOT NULL,
    "token1Price" REAL NOT NULL,
    "feesUSD" REAL NOT NULL,
    "totalValueLockedUSD" REAL NOT NULL,
    "poolAddress" TEXT NOT NULL,
    CONSTRAINT "PoolData_poolAddress_fkey" FOREIGN KEY ("poolAddress") REFERENCES "Pool" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PoolData" ("blockNumber", "feesUSD", "id", "poolAddress", "tick", "token0Price", "token1Price", "totalValueLockedUSD") SELECT "blockNumber", "feesUSD", "id", "poolAddress", "tick", "token0Price", "token1Price", "totalValueLockedUSD" FROM "PoolData";
DROP TABLE "PoolData";
ALTER TABLE "new_PoolData" RENAME TO "PoolData";
CREATE UNIQUE INDEX "PoolData_blockNumber_poolAddress_key" ON "PoolData"("blockNumber", "poolAddress");
CREATE TABLE "new_TickData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tickIdx" INTEGER NOT NULL,
    "feesUSD" REAL NOT NULL,
    "liquidityGross" BIGINT NOT NULL,
    "liquidityNet" BIGINT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    CONSTRAINT "TickData_poolAddress_blockNumber_fkey" FOREIGN KEY ("poolAddress", "blockNumber") REFERENCES "PoolData" ("poolAddress", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TickData" ("blockNumber", "feesUSD", "id", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx") SELECT "blockNumber", "feesUSD", "id", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx" FROM "TickData";
DROP TABLE "TickData";
ALTER TABLE "new_TickData" RENAME TO "TickData";
CREATE UNIQUE INDEX "TickData_tickIdx_blockNumber_poolAddress_key" ON "TickData"("tickIdx", "blockNumber", "poolAddress");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
