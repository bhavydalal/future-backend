import jwt from "jsonwebtoken";
import userModel from "../models/userModel"; // import the user model

const generateResetToken = async (user) => {
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  user.resetToken = resetToken;
  user.tokenExpiration = Date.now() + 3600000; // Set expiration time (1 hour from now)
  await user.save();
  return resetToken;
};

export default generateResetToken;
