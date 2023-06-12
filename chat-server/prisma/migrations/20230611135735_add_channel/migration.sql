/*
  Warnings:

  - You are about to drop the column `ChannelUserId` on the `block` table. All the data in the column will be lost.
  - You are about to drop the column `blockedId` on the `block` table. All the data in the column will be lost.
  - You are about to drop the column `blockerId` on the `block` table. All the data in the column will be lost.
  - Added the required column `blockedUserId` to the `block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blockerUserId` to the `block` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_block" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockedUserId" INTEGER NOT NULL,
    "blockerUserId" INTEGER NOT NULL,
    CONSTRAINT "block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "block_blockerUserId_fkey" FOREIGN KEY ("blockerUserId") REFERENCES "ChannelUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_block" ("id") SELECT "id" FROM "block";
DROP TABLE "block";
ALTER TABLE "new_block" RENAME TO "block";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
