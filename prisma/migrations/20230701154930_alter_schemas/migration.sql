/*
  Warnings:

  - You are about to drop the column `secondsSinceLast` on the `Block` table. All the data in the column will be lost.
  - Added the required column `tickSpacing` to the `Pool` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "token0" TEXT NOT NULL,
    "token1" TEXT NOT NULL,
    "tickSpacing" INTEGER NOT NULL,
    "feeTier" INTEGER NOT NULL,
    "name" TEXT
);
INSERT INTO "new_Pool" ("address", "feeTier", "id", "name", "token0", "token1") SELECT "address", "feeTier", "id", "name", "token0", "token1" FROM "Pool";
DROP TABLE "Pool";
ALTER TABLE "new_Pool" RENAME TO "Pool";
CREATE UNIQUE INDEX "Pool_address_key" ON "Pool"("address");
CREATE TABLE "new_Block" (
    "blockNumber" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timeStamp" BIGINT NOT NULL
);
INSERT INTO "new_Block" ("blockNumber", "timeStamp") SELECT "blockNumber", "timeStamp" FROM "Block";
DROP TABLE "Block";
ALTER TABLE "new_Block" RENAME TO "Block";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
