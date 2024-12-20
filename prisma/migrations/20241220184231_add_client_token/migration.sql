-- First add the column as nullable
ALTER TABLE "Bot" ADD COLUMN "clientToken" TEXT;

-- Update existing rows with a default token
UPDATE "Bot" SET "clientToken" = 'legacy_token';

-- Make the column required
ALTER TABLE "Bot" ALTER COLUMN "clientToken" SET NOT NULL;