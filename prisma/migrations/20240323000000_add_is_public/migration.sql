-- Add isPublic column as nullable first
ALTER TABLE "Bot" ADD COLUMN "isPublic" BOOLEAN;

-- Update existing rows with default value
UPDATE "Bot" SET "isPublic" = false;

-- Make the column required
ALTER TABLE "Bot" ALTER COLUMN "isPublic" SET NOT NULL; 