-- CreateTable
CREATE TABLE "TokenDeployment" (
    "id" TEXT NOT NULL,
    "clientToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TokenDeployment_clientToken_createdAt_idx" ON "TokenDeployment"("clientToken", "createdAt");
