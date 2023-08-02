-- CreateTable
CREATE TABLE "Pool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "token0" TEXT NOT NULL,
    "token1" TEXT NOT NULL,
    "feeTier" INTEGER NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "PoolData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockNumber" INTEGER NOT NULL,
    "tick" INTEGER NOT NULL,
    "token0Price" BIGINT NOT NULL,
    "token1Price" BIGINT NOT NULL,
    "feesUSD" INTEGER NOT NULL,
    "totalValueLockedUSD" INTEGER NOT NULL,
    "poolId" INTEGER NOT NULL,
    CONSTRAINT "PoolData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pool_address_key" ON "Pool"("address");
