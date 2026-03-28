/*
  Warnings:

  - You are about to drop the column `quizId` on the `UserScore` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserScore" DROP CONSTRAINT "UserScore_quizId_fkey";

-- AlterTable
ALTER TABLE "UserScore" DROP COLUMN "quizId";
