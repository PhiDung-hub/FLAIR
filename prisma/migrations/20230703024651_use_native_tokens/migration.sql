/*
  Warnings:

  - You are about to drop the column `feesUSD` on the `TickData` table. All the data in the column will be lost.
  - You are about to drop the column `feesUSD` on the `PoolData` table. All the data in the column will be lost.
  - You are about to drop the column `totalValueLockedUSD` on the `PoolData` table. All the data in the column will be lost.
  - Added the required column `lockedToken0` to the `TickData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lockedToken1` to the `TickData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `culmulativeVolumeToken0` to the `PoolData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `culmulativeVolumeToken1` to the `PoolData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feesToken0` to the `PoolData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feesToken1` to the `PoolData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalValueLockedToken0` to the `PoolData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalValueLockedToken1` to the `PoolData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TickData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tickIdx" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "liquidityGross" BIGINT NOT NULL,
    "liquidityNet" BIGINT NOT NULL,
    "lockedToken0" REAL NOT NULL,
    "lockedToken1" REAL NOT NULL,
    CONSTRAINT "TickData_poolAddress_blockNumber_fkey" FOREIGN KEY ("poolAddress", "blockNumber") REFERENCES "PoolData" ("poolAddress", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TickData" ("blockNumber", "id", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx") SELECT "blockNumber", "id", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx" FROM "TickData";
DROP TABLE "TickData";
ALTER TABLE "new_TickData" RENAME TO "TickData";
CREATE UNIQUE INDEX "TickData_tickIdx_blockNumber_poolAddress_key" ON "TickData"("tickIdx", "blockNumber", "poolAddress");
CREATE TABLE "new_PoolData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockNumber" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "tick" INTEGER NOT NULL,
    "token0Price" REAL NOT NULL,
    "token1Price" REAL NOT NULL,
    "totalValueLockedToken0" REAL NOT NULL,
    "totalValueLockedToken1" REAL NOT NULL,
    "culmulativeVolumeToken0" REAL NOT NULL,
    "culmulativeVolumeToken1" REAL NOT NULL,
    "feesToken0" REAL NOT NULL,
    "feesToken1" REAL NOT NULL,
    CONSTRAINT "PoolData_poolAddress_fkey" FOREIGN KEY ("poolAddress") REFERENCES "Pool" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PoolData" ("blockNumber", "id", "poolAddress", "tick", "token0Price", "token1Price") SELECT "blockNumber", "id", "poolAddress", "tick", "token0Price", "token1Price" FROM "PoolData";
DROP TABLE "PoolData";
ALTER TABLE "new_PoolData" RENAME TO "PoolData";
CREATE UNIQUE INDEX "PoolData_blockNumber_poolAddress_key" ON "PoolData"("blockNumber", "poolAddress");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
