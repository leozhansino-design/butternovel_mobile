-- Mark ButterPicks as official account
-- This script should be run manually or as part of deployment

-- Update the official account
UPDATE "User"
SET "isOfficial" = true
WHERE email = 'admin@butternovel.com';

-- Verify the update
SELECT id, email, name, "isOfficial"
FROM "User"
WHERE email = 'admin@butternovel.com';
