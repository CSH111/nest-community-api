/*
  Warnings:

  - You are about to drop the column `is_pinned` on the `posts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `posts_is_pinned_idx` ON `posts`;

-- AlterTable
ALTER TABLE `posts` DROP COLUMN `is_pinned`;
