import jwt from "jsonwebtoken";

const authAdmin = (req, res, next) => {
  
  try {
    const token = req.headers.token;

if (!token) {
  return res.status(401).json({ success: false, message: "No admin token" });
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);

if (!decoded.isAdmin) {
  return res.status(403).json({ success: false, message: "Not an admin" });
}

    req.adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token"
    });
  }
};

export default authAdmin;
