import validator from "validator";

import argon2 from "argon2";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "futrclo@gmail.com", // Add your email
    pass: "szza brxy kayx barl", // Add your email's password
  },
});

// Route for forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    // Generate reset token
    const token = createToken(user._id);

    // Save token and expiration time in the database
    user.resetToken = token;
    user.tokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with the reset token
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: http://futrclo.in/reset-password?token=${token}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    console.log("Error during forgot password process: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  console.log("res", res);
  try {
    const { token, newPassword } = req.body;

    // Step 1: Decode the token to get user ID
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Step 2: Find user by ID
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 3: Check if the token has expired
    if (Date.now() > user.tokenExpiration) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    // Step 4: Hash the new password
    const hashedPassword = await argon2.hash(newPassword);

    // Step 5: Update the user's password and clear reset token and expiration
    user.password = hashedPassword;
    user.resetToken = null; // Clear the reset token
    user.tokenExpiration = null; // Clear the token expiration
    await user.save();

    // Step 6: Respond with success message
    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exists" });
    }

    const isMatch = await argon2.verify(user.password, password);

    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, token, email: user.email });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for user register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // checking user already exists or not
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // hashing user password
    const hashedPassword = await argon2.hash(password);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();

    const token = createToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin, forgotPassword, resetPassword };
