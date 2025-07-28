import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;
  try {
    if (!fullName || !email || !password || !bio) {
      return res.status(400).json({ success: false, message: "Missing details" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: "Account already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio
    });
    const token = generateToken(newUser._id);
    res.json({ success: true, userData: newUser, token, message: "Account created successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(400).json({ success: false, message: "No account with that email" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }
    const token = generateToken(userData._id);
    res.json({ success: true, userData, token, message: "Login successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
  console.log('req.user:', req.user);
};


export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const { secure_url } = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: secure_url, bio, fullName },
        { new: true }
      );
    }
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
