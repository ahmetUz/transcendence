-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_block" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockedUserId" INTEGER NOT NULL,
    "blockerUserId" INTEGER NOT NULL,
    "blockerChannelUserId" INTEGER NOT NULL DEFAULT -1,
    "blockedChannelUserId" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "block_blockerChannelUserId_fkey" FOREIGN KEY ("blockerChannelUserId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "block_blockedChannelUserId_fkey" FOREIGN KEY ("blockedChannelUserId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_block" ("blockedUserId", "blockerUserId", "id") SELECT "blockedUserId", "blockerUserId", "id" FROM "block";
DROP TABLE "block";
ALTER TABLE "new_block" RENAME TO "block";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
