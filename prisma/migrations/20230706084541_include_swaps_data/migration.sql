-- CreateTable
CREATE TABLE "SwapData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "poolAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "amount0" REAL NOT NULL,
    "amount1" REAL NOT NULL,
    "tick" INTEGER NOT NULL,
    "gasETH" REAL NOT NULL,
    CONSTRAINT "SwapData_poolAddress_blockNumber_fkey" FOREIGN KEY ("poolAddress", "blockNumber") REFERENCES "PoolData" ("poolAddress", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE
);
