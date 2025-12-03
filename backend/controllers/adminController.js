import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'


// -------------------- ADD DOCTOR --------------------
const addDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            speciality,
            degree,
            experience,
            about,
            feeStructure,
            address
        } = req.body

        const imageFile = req.file

        // validate required fields
        if (!name || !email || !password || !imageFile || !speciality ||
            !degree || !experience || !about || !feeStructure || !address) {
            return res.json({ success: false, message: "All fields are required" })
        }

        // email validation
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid email format" })
        }

        // password validation
        if (password.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters long" })
        }

        // hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to Cloudinary
        const uploadedImage = await cloudinary.uploader.upload(imageFile.path, {
            resource_type: "image",
            folder: "doctors"
        })

        const imageUrl = uploadedImage.secure_url

        // create doctor object
        const doctorData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            speciality,
            degree,
            experience,
            about,
            feeStructure,
            address,
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.json({ success: true, message: "Doctor Added Successfully" })
    }
    catch (error) {
        console.error("Error adding doctor:", error)
        res.json({ success: false, message: error.message })
    }
}



// -------------------- ADMIN LOGIN --------------------
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

            // ⭐ SIGN TOKEN CORRECTLY
            const token = jwt.sign(
                { email: process.env.ADMIN_EMAIL },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            )

            return res.json({ success: true, token })
        }

        res.json({ success: false, message: "Invalid admin credentials" })
    }
    catch (error) {
        console.error("Login error:", error)
        res.json({ success: false, message: error.message })
    }
}



// -------------------- GET ALL DOCTORS --------------------
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })
    }
    catch (error) {
        console.error("Fetch doctors error:", error)
        res.json({ success: false, message: error.message })
    }
}


export { addDoctor, loginAdmin, allDoctors }
