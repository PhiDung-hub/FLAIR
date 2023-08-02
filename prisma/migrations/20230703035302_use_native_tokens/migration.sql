/*
  Warnings:

  - A unique constraint covering the columns `[token0,token1,feeTier]` on the table `Pool` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pool_token0_token1_feeTier_key" ON "Pool"("token0", "token1", "feeTier");
