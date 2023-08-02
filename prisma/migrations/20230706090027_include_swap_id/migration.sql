/*
  Warnings:

  - Added the required column `swapId` to the `SwapData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SwapData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "swapId" TEXT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "amount0" REAL NOT NULL,
    "amount1" REAL NOT NULL,
    "tick" INTEGER NOT NULL,
    "gasETH" REAL NOT NULL,
    CONSTRAINT "SwapData_poolAddress_blockNumber_fkey" FOREIGN KEY ("poolAddress", "blockNumber") REFERENCES "PoolData" ("poolAddress", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SwapData" ("amount0", "amount1", "blockNumber", "gasETH", "id", "poolAddress", "tick") SELECT "amount0", "amount1", "blockNumber", "gasETH", "id", "poolAddress", "tick" FROM "SwapData";
DROP TABLE "SwapData";
ALTER TABLE "new_SwapData" RENAME TO "SwapData";
CREATE UNIQUE INDEX "SwapData_swapId_key" ON "SwapData"("swapId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
