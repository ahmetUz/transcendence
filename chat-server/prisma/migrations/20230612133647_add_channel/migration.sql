/*
  Warnings:

  - You are about to alter the column `ownerId` on the `Channel` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Channel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ChannelName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL DEFAULT -1
);
INSERT INTO "new_Channel" ("ChannelName", "id", "ownerId", "password") SELECT "ChannelName", "id", "ownerId", "password" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
