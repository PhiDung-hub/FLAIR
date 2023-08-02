/*
  Warnings:

  - Added the required column `blockNumber` to the `TickData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poolAddress` to the `TickData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TickData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tickIdx" INTEGER NOT NULL,
    "feesUSD" INTEGER NOT NULL,
    "liquidityGross" BIGINT NOT NULL,
    "liquidityNet" BIGINT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "poolDataId" INTEGER NOT NULL,
    CONSTRAINT "TickData_poolAddress_blockNumber_fkey" FOREIGN KEY ("poolAddress", "blockNumber") REFERENCES "PoolData" ("poolAddress", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TickData" ("feesUSD", "id", "liquidityGross", "liquidityNet", "poolDataId", "tickIdx") SELECT "feesUSD", "id", "liquidityGross", "liquidityNet", "poolDataId", "tickIdx" FROM "TickData";
DROP TABLE "TickData";
ALTER TABLE "new_TickData" RENAME TO "TickData";
CREATE UNIQUE INDEX "TickData_tickIdx_poolDataId_key" ON "TickData"("tickIdx", "poolDataId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
