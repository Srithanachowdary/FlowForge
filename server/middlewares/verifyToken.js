import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Access token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "zive_access_token_super_secret_key_12345!"
    );

    const user = await User.findById(decoded._id).select("-passwordHash -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Access token expired"));
    }
    return next(new ApiError(401, error.message || "Invalid access token"));
  }
};
