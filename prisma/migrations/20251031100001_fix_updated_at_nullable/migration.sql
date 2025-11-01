-- Make updatedAt column nullable and update existing records
UPDATE "sat_diagnostic_results" 
SET "updatedAt" = "createdAt" 
WHERE "updatedAt" IS NULL;

-- This will ensure all existing records have a value for updatedAt
-- The Prisma schema already defines it as DateTime? (nullable) so no ALTER COLUMN needed