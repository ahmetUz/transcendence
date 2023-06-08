/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ChannelToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ChannelToUser";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ChannelUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "Name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChannelToChannelUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ChannelToChannelUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChannelToChannelUser_B_fkey" FOREIGN KEY ("B") REFERENCES "ChannelUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ChannelToChannelUser_AB_unique" ON "_ChannelToChannelUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChannelToChannelUser_B_index" ON "_ChannelToChannelUser"("B");
