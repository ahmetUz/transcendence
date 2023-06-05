/*
  Warnings:

  - The primary key for the `textChannel` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_textChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL
);
INSERT INTO "new_textChannel" ("id", "name", "text") SELECT "id", "name", "text" FROM "textChannel";
DROP TABLE "textChannel";
ALTER TABLE "new_textChannel" RENAME TO "textChannel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
