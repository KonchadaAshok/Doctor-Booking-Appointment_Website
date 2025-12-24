import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  try {
    console.log("🔥 AUTH MIDDLEWARE HIT");

    const token = req.headers.token;

    console.log("TOKEN RECEIVED:", token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    next();

  } catch (error) {
    console.error("JWT ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Session expired. Please login again"
    });
  }
};

export default authUser;
