-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_textChannel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "channelUserId" INTEGER NOT NULL DEFAULT -1,
    "channelId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "textChannel_channelUserId_fkey" FOREIGN KEY ("channelUserId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "textChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_textChannel" ("channelId", "id", "name", "text") SELECT "channelId", "id", "name", "text" FROM "textChannel";
DROP TABLE "textChannel";
ALTER TABLE "new_textChannel" RENAME TO "textChannel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
