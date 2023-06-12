/*
  Warnings:

  - You are about to drop the column `owner` on the `Channel` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "channelUserId" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "channelUserId_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "channelUserId_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Channel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ChannelName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Channel" ("ChannelName", "id", "password") SELECT "ChannelName", "id", "password" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
