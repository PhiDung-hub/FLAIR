/*
  Warnings:

  - You are about to drop the column `poolId` on the `PoolData` table. All the data in the column will be lost.
  - You are about to alter the column `token0Price` on the `PoolData` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `token1Price` on the `PoolData` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - Added the required column `poolAddress` to the `PoolData` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TickData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tickIdx" INTEGER NOT NULL,
    "liquidityGross" BIGINT NOT NULL,
    "liquidityNet" BIGINT NOT NULL,
    "poolDataId" INTEGER NOT NULL,
    CONSTRAINT "TickData_poolDataId_fkey" FOREIGN KEY ("poolDataId") REFERENCES "PoolData" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PoolData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockNumber" INTEGER NOT NULL,
    "tick" INTEGER NOT NULL,
    "token0Price" INTEGER NOT NULL,
    "token1Price" INTEGER NOT NULL,
    "feesUSD" INTEGER NOT NULL,
    "totalValueLockedUSD" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    CONSTRAINT "PoolData_poolAddress_fkey" FOREIGN KEY ("poolAddress") REFERENCES "Pool" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PoolData" ("blockNumber", "feesUSD", "id", "tick", "token0Price", "token1Price", "totalValueLockedUSD") SELECT "blockNumber", "feesUSD", "id", "tick", "token0Price", "token1Price", "totalValueLockedUSD" FROM "PoolData";
DROP TABLE "PoolData";
ALTER TABLE "new_PoolData" RENAME TO "PoolData";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
