import jwt from "jsonwebtoken";

const authDoctor = (req, res, next) => {
  try {
    console.log("🔥 AUTH MIDDLEWARE HIT");

    const dtoken = req.headers.token;

    console.log("TOKEN RECEIVED:", dtoken);

    if (!dtoken) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again"
      });
    }

    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);

    req.docId = decoded.id;
    next();

  } catch (error) {
    console.error("JWT ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Session expired. Please login again"
    });
  }
};

export default authDoctor;
