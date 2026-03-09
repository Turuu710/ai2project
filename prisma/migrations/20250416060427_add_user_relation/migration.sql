/*
  Warnings:

  - Made the column `summary` on table `Article` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "summary" SET NOT NULL;

-- AlterTable
ALTER TABLE "Quiz" ALTER COLUMN "answer" SET DATA TYPE TEXT;
