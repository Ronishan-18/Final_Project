-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all sample data tables
TRUNCATE TABLE achievements;
TRUNCATE TABLE friendships;
TRUNCATE TABLE game_identities;
TRUNCATE TABLE gamer_profiles;
TRUNCATE TABLE matches;
TRUNCATE TABLE messages;
TRUNCATE TABLE notifications;
TRUNCATE TABLE organizer_profiles;
TRUNCATE TABLE payments;
TRUNCATE TABLE profiles;
TRUNCATE TABLE sponsor_profiles;
TRUNCATE TABLE suspension_appeals;
TRUNCATE TABLE team_members;
TRUNCATE TABLE teams;
TRUNCATE TABLE tournament_registrations;
TRUNCATE TABLE tournaments;

-- Delete all users except for the primary admin (id: 1)
-- Using DELETE instead of TRUNCATE to preserve the admin user
DELETE FROM users WHERE id != 1;

-- Reset auto-increment for users (optional, but clean)
-- If we want the next user to have id 2, we should see what the last id was.
-- But since we deleted everything else, setting it to start after 1 is fine.
ALTER TABLE users AUTO_INCREMENT = 2;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
