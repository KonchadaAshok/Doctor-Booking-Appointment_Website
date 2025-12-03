import jwt from 'jsonwebtoken'

const authAdmin = (req, res, next) => {
    try {
        const token = req.headers['atoken'];

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validate admin
        if (decoded.email !== process.env.ADMIN_EMAIL) {
            return res.status(401).json({ success: false, message: "Unauthorized admin" });
        }

        req.admin = decoded;
        next();
    } 
    catch (error) {
        console.log(error);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export default authAdmin;
