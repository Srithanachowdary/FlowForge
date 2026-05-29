import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";

// Cookie options for secure storage of Refresh Token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching JWT expiration
};

// 1. Register User
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, "All fields (name, email, password) are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      isVerified: false,
      verifyToken,
      verifyTokenExpiry
    });

    const verificationLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email/${verifyToken}`;

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: "Verify your Zive Account",
      html: `
        <h3>Welcome to Zive!</h3>
        <p>Hi ${user.name},</p>
        <p>Please verify your email by clicking on the link below:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Welcome to Zive! Please verify your email by clicking: ${verificationLink}`
    });

    // Strip password from output
    const registeredUser = await User.findById(user._id).select("-passwordHash -refreshToken");

    return res
      .status(201)
      .json(new ApiResponse(211, registeredUser, "Registration successful. Verification email dispatched."));
  } catch (error) {
    next(error);
  }
};

// 2. Login User
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Verify Password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check email verification status
    if (!user.isVerified) {
      throw new ApiError(403, "Please verify your email before logging in. Check your mailbox.");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save();

    // Set refresh token in secure cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    const loggedInUser = await User.findById(user._id).select("-passwordHash -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Logged in successfully"));
  } catch (error) {
    next(error);
  }
};

// 3. Verify Email
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, "Verification token is invalid or has expired");
    }

    user.isVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Email verified successfully. You can now log in."));
  } catch (error) {
    next(error);
  }
};

// 4. Refresh Token (Rotation Flow)
export const refresh = async (req, res, next) => {
  try {
    // Get refresh token from cookie
    const cookieToken = req.cookies?.refreshToken;
    if (!cookieToken) {
      throw new ApiError(401, "Refresh token is missing");
    }

    // Decode refresh token
    const decoded = jwt.verify(
      cookieToken,
      process.env.JWT_REFRESH_SECRET || "zive_refresh_token_super_secret_key_67890!"
    );

    const user = await User.findById(decoded._id);
    if (!user || !user.refreshToken) {
      throw new ApiError(401, "Invalid refresh token: Session expired");
    }

    // Verify refresh token matching hashed token in DB
    const isMatched = await bcrypt.compare(cookieToken, user.refreshToken);
    if (!isMatched) {
      // Refresh token theft detected! Invalidate all refresh tokens for this user
      user.refreshToken = null;
      await user.save();
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      throw new ApiError(403, "Token reuse detected! Access revoked. Please log in again.");
    }

    // Generate new Access and Refresh tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Save hashed new refresh token
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(newRefreshToken, salt);
    await user.save();

    // Reset cookie
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: newAccessToken },
          "Access token rotated successfully"
        )
      );
  } catch (error) {
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    next(error);
  }
};

// 5. Logout User
export const logout = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (cookieToken) {
      // Find user and clear active refresh token
      try {
        const decoded = jwt.verify(
          cookieToken,
          process.env.JWT_REFRESH_SECRET || "zive_refresh_token_super_secret_key_67890!"
        );
        const user = await User.findById(decoded._id);
        if (user) {
          user.refreshToken = null;
          await user.save();
        }
      } catch (err) {
        // Token was invalid or expired, continue cleaning cookie
      }
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

// 6. Forgot Password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Silently return success to avoid email enum attacks
      return res
        .status(200)
        .json(new ApiResponse(200, null, "If the email exists, a password reset link has been sent."));
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your Zive Password",
      html: `
        <h3>Reset Password Request</h3>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
      `,
      text: `Reset your Zive password: ${resetLink}`
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset link sent to email"));
  } catch (error) {
    next(error);
  }
};

// 7. Reset Password
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, "Reset token is invalid or has expired");
    }

    // Set new password (pre-save hook hashes it)
    user.passwordHash = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.refreshToken = null; // Invalidate current session
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password updated successfully. Please log in again."));
  } catch (error) {
    next(error);
  }
};

// 8. Get Me
export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json(new ApiResponse(200, req.user, "User profile fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// 9. Google Direct One-Tap Login (verified via token on backend)
export const googleOneTapLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      throw new ApiError(400, "Google credential token is missing");
    }

    // Verify token payload
    const decodedToken = jwt.decode(credential);
    if (!decodedToken) {
      throw new ApiError(400, "Invalid Google credential token");
    }

    const { sub: googleId, email, name, picture: avatar } = decodedToken;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Connect Google account if email matched but googleId was null
      if (!user.googleId) {
        user.googleId = googleId;
      }
      user.avatar = user.avatar || avatar || "";
      user.isVerified = true;
    } else {
      // Create new user authenticated via Google
      user = new User({
        name,
        email,
        googleId,
        avatar: avatar || "",
        isVerified: true
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save hashed refresh token
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save();

    // Set cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    const loggedInUser = await User.findById(user._id).select("-passwordHash -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Logged in via Google successfully"));
  } catch (error) {
    next(error);
  }
};
