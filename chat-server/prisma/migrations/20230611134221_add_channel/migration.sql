-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_block" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockedId" INTEGER NOT NULL,
    "blockerId" INTEGER NOT NULL,
    CONSTRAINT "block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_block" ("blockedId", "blockerId", "id") SELECT "blockedId", "blockerId", "id" FROM "block";
DROP TABLE "block";
ALTER TABLE "new_block" RENAME TO "block";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
