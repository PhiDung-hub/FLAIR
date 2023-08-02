/*
  Warnings:

  - You are about to drop the column `poolDataId` on the `TickData` table. All the data in the column will be lost.

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
    CONSTRAINT "TickData_poolAddress_blockNumber_fkey" FOREIGN KEY ("poolAddress", "blockNumber") REFERENCES "PoolData" ("poolAddress", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TickData" ("blockNumber", "feesUSD", "id", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx") SELECT "blockNumber", "feesUSD", "id", "liquidityGross", "liquidityNet", "poolAddress", "tickIdx" FROM "TickData";
DROP TABLE "TickData";
ALTER TABLE "new_TickData" RENAME TO "TickData";
CREATE UNIQUE INDEX "TickData_tickIdx_blockNumber_poolAddress_key" ON "TickData"("tickIdx", "blockNumber", "poolAddress");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
