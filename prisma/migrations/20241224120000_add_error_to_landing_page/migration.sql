-- Add error column as nullable
ALTER TABLE "LandingPage" ADD COLUMN IF NOT EXISTS "error" TEXT; 