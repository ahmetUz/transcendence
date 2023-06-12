/*
  Warnings:

  - You are about to drop the `channelUserId` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "channelUserId";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "blockedUsers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "blockedUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blockedBy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "blockedBy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
