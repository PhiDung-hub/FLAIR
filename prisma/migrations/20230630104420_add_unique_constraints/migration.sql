/*
  Warnings:

  - A unique constraint covering the columns `[blockNumber,poolAddress]` on the table `PoolData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tickIdx,poolDataId]` on the table `TickData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PoolData_blockNumber_poolAddress_key" ON "PoolData"("blockNumber", "poolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TickData_tickIdx_poolDataId_key" ON "TickData"("tickIdx", "poolDataId");
