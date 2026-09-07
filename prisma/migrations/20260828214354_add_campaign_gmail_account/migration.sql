-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "gmailAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_gmailAccountId_fkey" FOREIGN KEY ("gmailAccountId") REFERENCES "GmailAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
