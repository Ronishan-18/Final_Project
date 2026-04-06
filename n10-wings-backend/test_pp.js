import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv/config';

try {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );
  console.log('✅ Strategy initialized successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Strategy initialization failed:', error.message);
  process.exit(1);
}
