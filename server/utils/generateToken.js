import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET || "zive_access_token_super_secret_key_12345!",
    {
      expiresIn: process.env.JWT_EXPIRY || "15m"
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      _id: user._id
    },
    process.env.JWT_REFRESH_SECRET || "zive_refresh_token_super_secret_key_67890!",
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d"
    }
  );
};
