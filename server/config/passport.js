import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.model.js";

const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id_here") {
    console.log("ℹ️  Google OAuth credentials missing in env. passport-google-oauth20 disabled.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            return done(null, user);
          }

          // Check if email already registered via email/password
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              user.avatar = user.avatar || profile.photos?.[0]?.value || "";
              user.isVerified = true;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            name: profile.displayName || "Google User",
            email: email || `${profile.id}@google.com`,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || "",
            isVerified: true
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};

export default configurePassport;
export { configurePassport };
