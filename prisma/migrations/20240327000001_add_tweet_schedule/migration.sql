-- CreateTable
CREATE TABLE "TweetSchedule" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "interval" INTEGER NOT NULL DEFAULT 180,

    CONSTRAINT "TweetSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TweetSchedule_botId_key" ON "TweetSchedule"("botId");

-- AddForeignKey
ALTER TABLE "TweetSchedule" ADD CONSTRAINT "TweetSchedule_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE; 