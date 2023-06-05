/*
  Warnings:

  - The primary key for the `textChannel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `textChannel` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_textChannel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL
);
INSERT INTO "new_textChannel" ("id", "name", "text") SELECT "id", "name", "text" FROM "textChannel";
DROP TABLE "textChannel";
ALTER TABLE "new_textChannel" RENAME TO "textChannel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
