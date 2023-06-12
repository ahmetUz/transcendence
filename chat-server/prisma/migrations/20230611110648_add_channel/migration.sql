-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChannelUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "Name" TEXT NOT NULL DEFAULT 'unknown',
    "muted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_ChannelUser" ("Name", "clientId", "id") SELECT "Name", "clientId", "id" FROM "ChannelUser";
DROP TABLE "ChannelUser";
ALTER TABLE "new_ChannelUser" RENAME TO "ChannelUser";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
