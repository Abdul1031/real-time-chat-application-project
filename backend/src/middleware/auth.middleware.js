import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = bearerToken || req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      res.cookie("jwt", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.cookie("jwt", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("error in protectRoute middlewere:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
