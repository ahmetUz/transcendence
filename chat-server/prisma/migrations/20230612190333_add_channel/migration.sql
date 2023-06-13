/*
  Warnings:

  - You are about to drop the `_ChannelToChannelUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "_ChannelToChannelUser_B_index";

-- DropIndex
DROP INDEX "_ChannelToChannelUser_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ChannelToChannelUser";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChannelUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "Name" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'user',
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "channelId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "ChannelUser_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChannelUser" ("Name", "clientId", "id", "muted", "status") SELECT "Name", "clientId", "id", "muted", "status" FROM "ChannelUser";
DROP TABLE "ChannelUser";
ALTER TABLE "new_ChannelUser" RENAME TO "ChannelUser";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
