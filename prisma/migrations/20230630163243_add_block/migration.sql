-- CreateTable
CREATE TABLE "Block" (
    "blockNumber" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timeStamp" BIGINT NOT NULL,
    "secondsSinceLast" INTEGER NOT NULL
);
