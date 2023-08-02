-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "token0" TEXT NOT NULL,
    "token1" TEXT NOT NULL,
    "decimals0" INTEGER NOT NULL DEFAULT 18,
    "decimals1" INTEGER NOT NULL DEFAULT 18,
    "tickSpacing" INTEGER NOT NULL,
    "feeTier" INTEGER NOT NULL,
    "name" TEXT
);
INSERT INTO "new_Pool" ("address", "feeTier", "id", "name", "tickSpacing", "token0", "token1") SELECT "address", "feeTier", "id", "name", "tickSpacing", "token0", "token1" FROM "Pool";
DROP TABLE "Pool";
ALTER TABLE "new_Pool" RENAME TO "Pool";
CREATE UNIQUE INDEX "Pool_address_key" ON "Pool"("address");
CREATE UNIQUE INDEX "Pool_token0_token1_feeTier_key" ON "Pool"("token0", "token1", "feeTier");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
