import jwt from "jsonwebtoken";

export const getJwtCookieOptions = (maxAge) => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    maxAge,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  };
};

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, getJwtCookieOptions(7 * 24 * 60 * 60 * 1000));
  return token;
};
