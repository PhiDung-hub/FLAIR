/*
  Warnings:

  - Added the required column `feesUSD` to the `TickData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TickData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tickIdx" INTEGER NOT NULL,
    "feesUSD" INTEGER NOT NULL,
    "liquidityGross" BIGINT NOT NULL,
    "liquidityNet" BIGINT NOT NULL,
    "poolDataId" INTEGER NOT NULL,
    CONSTRAINT "TickData_poolDataId_fkey" FOREIGN KEY ("poolDataId") REFERENCES "PoolData" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TickData" ("id", "liquidityGross", "liquidityNet", "poolDataId", "tickIdx") SELECT "id", "liquidityGross", "liquidityNet", "poolDataId", "tickIdx" FROM "TickData";
DROP TABLE "TickData";
ALTER TABLE "new_TickData" RENAME TO "TickData";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
