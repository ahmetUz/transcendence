-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Channel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'public',
    "ChannelName" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Channel" ("ChannelName", "id", "password") SELECT "ChannelName", "id", "password" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
CREATE TABLE "new_ChannelUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "Name" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'user',
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "kicked" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "muteExpiration" DATETIME,
    "kickExpiration" DATETIME,
    "banExpiration" DATETIME,
    "channelId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "ChannelUser_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChannelUser" ("Name", "channelId", "clientId", "id", "muted", "status") SELECT "Name", "channelId", "clientId", "id", "muted", "status" FROM "ChannelUser";
DROP TABLE "ChannelUser";
ALTER TABLE "new_ChannelUser" RENAME TO "ChannelUser";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
