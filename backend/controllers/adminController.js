import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'

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
      !degree || !experience || !about || !feeStructure) {
      return res.json({ success: false, message: "All fields are required" })
    }

    // address validation
    // ✅ Address validation (FIX)
    if (!address || !address.line1 || !address.line2) {
      return res.json({
        success: false,
        message: "Address line1 and line2 are required"
      });
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
      address: {
        line1: address.line1,
        line2: address.line2
      },
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
// -------------------- ADMIN LOGIN --------------------
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check admin credentials
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // ✅ CREATE ADMIN TOKEN HERE
    const token = jwt.sign(
      {
        id: "admin-id",      // can be anything (string)
        isAdmin: true        // 🔥 REQUIRED FOR MIDDLEWARE
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
    });

  } catch (error) {
    console.error("Admin login error:", error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};




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

//API to get all appointments for a doctor
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({})
    res.json({ success: true, appointments })
  } catch (error) {
    console.error("Fetch appointments error:", error)
    res.json({ success: false, message: error.message })
  }
}

// API for appointment cancellation 
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.json({
        success: false,
        message: "Appointment ID is required"
      });
    }

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.cancelled) {
      return res.json({
        success: false,
        message: "Appointment already cancelled"
      });
    }

    // ✅ Cancel appointment
    appointment.cancelled = true;
    await appointment.save();

    // ✅ Free doctor slot
    const slotKey = `${appointment.slotDate} ${appointment.slotTime}`;
    await doctorModel.findByIdAndUpdate(
      appointment.docId,
      { $pull: { slots_booked: slotKey } }
    );

    return res.json({
      success: true,
      message: appointment.payment
        ? "Appointment cancelled. Payment recorded."
        : "Appointment cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel appointment error:", error);
    return res.json({
      success: false,
      message: error.message
    });
  }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({})
    const users = await userModel.find({})
    const appointments = await appointmentModel.find({})

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5) // Get latest 5 appointments
    }

    res.json({ success: true, dashData })

  } catch (error) {
    console.error("Cancel appointment error:", error);
    return res.json({
      success: false,
      message: error.message
    });
  }
}

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard }