-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_channelUserId" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "channelUserId_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "channelUserId_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_channelUserId" ("id", "userId") SELECT "id", "userId" FROM "channelUserId";
DROP TABLE "channelUserId";
ALTER TABLE "new_channelUserId" RENAME TO "channelUserId";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
