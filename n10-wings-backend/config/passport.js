import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from './db.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleName = profile.displayName;
        const username = googleName
          .replace(/\s+/g, '_')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        const avatar = profile.photos?.[0]?.value || null;

        // Check existing user
        const [existing] = await db.query(
          'SELECT * FROM users WHERE email = ?', [email]
        );

        if (existing.length > 0) {
          console.log('✅ Google OAuth: Existing user →', email);
          return done(null, existing[0]);
        }

        // Generate unique username
        let finalUsername = username || `user_${Date.now()}`;
        const [usernameTaken] = await db.query(
          'SELECT id FROM users WHERE username = ?', [finalUsername]
        );
        if (usernameTaken.length > 0) {
          finalUsername = `${finalUsername}_${Date.now()}`;
        }

        // Create new user
        const [result] = await db.query(
          `INSERT INTO users
           (username, email, password, role, is_verified, is_active)
           VALUES (?, ?, NULL, 'user', TRUE, TRUE)`,
          [finalUsername, email]
        );

        const newUserId = result.insertId;

        // Create profiles
        await db.query(
          `INSERT INTO profiles (user_id, full_name, avatar)
           VALUES (?, ?, ?)`,
          [newUserId, googleName, avatar]
        );

        await db.query(
          'INSERT INTO gamer_profiles (user_id) VALUES (?)',
          [newUserId]
        );

        const [newUser] = await db.query(
          'SELECT * FROM users WHERE id = ?', [newUserId]
        );

        console.log('✅ Google OAuth: New user created →', email);
        return done(null, newUser[0]);

      } catch (error) {
        console.error('❌ Google OAuth Error:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?', [id]
    );
    done(null, users[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;