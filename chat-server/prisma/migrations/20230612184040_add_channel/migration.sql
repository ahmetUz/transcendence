/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Channel` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Channel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ChannelName" TEXT NOT NULL,
    "password" TEXT NOT NULL
);
INSERT INTO "new_Channel" ("ChannelName", "id", "password") SELECT "ChannelName", "id", "password" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
CREATE TABLE "new_ChannelUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "Name" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'user',
    "muted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_ChannelUser" ("Name", "clientId", "id", "muted") SELECT "Name", "clientId", "id", "muted" FROM "ChannelUser";
DROP TABLE "ChannelUser";
ALTER TABLE "new_ChannelUser" RENAME TO "ChannelUser";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
