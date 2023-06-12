/*
  Warnings:

  - You are about to drop the `blockedBy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blockedUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "blockedBy";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "blockedUsers";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "block" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockedId" INTEGER NOT NULL,
    "blockerId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
