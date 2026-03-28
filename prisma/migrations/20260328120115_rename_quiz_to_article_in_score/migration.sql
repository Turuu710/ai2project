/*
  Warnings:

  - Added the required column `articleId` to the `UserScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSpent` to the `UserScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserScore" ADD COLUMN     "articleId" TEXT NOT NULL,
ADD COLUMN     "timeSpent" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
