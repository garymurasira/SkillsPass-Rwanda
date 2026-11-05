-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "seq" SERIAL NOT NULL;

-- DropIndex
DROP INDEX "Message_senderId_receiverId_sentAt_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Message_seq_key" ON "Message"("seq");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_seq_idx" ON "Message"("senderId", "receiverId", "seq");

-- CreateIndex
CREATE INDEX "Message_receiverId_senderId_seq_idx" ON "Message"("receiverId", "senderId", "seq");
