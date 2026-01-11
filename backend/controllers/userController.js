import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";
import crypto from "crypto";

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong password" });
    }

    // Check if email already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const user = await new userModel(userData).save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email or password is missing" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get profile
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;  // use the one from middleware
    const userData = await userModel.findById(userId).select('-password');

    res.json({ success: true, userData });
  }
  catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;  // 🔥 take userId from token
    const { name, phone, address, dob, gender } = req.body;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    // Convert address JSON safely
    let parsedAddress = {};
    try {
      parsedAddress = JSON.parse(address);
    } catch (e) {
      parsedAddress = address; // if sending object directly
    }

    // update basic fields
    await userModel.findByIdAndUpdate(
      userId,
      {
        $set: { name, phone, dob, gender, address: parsedAddress }
      },
      { new: true }
    );

    // Handle image upload
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });

      await userModel.findByIdAndUpdate(
        userId,
        { $set: { image: uploaded.secure_url } }
      );
    }

    return res.json({ success: true, message: "Profile Updated" });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { docId, slotDate, slotTime } = req.body;

    // Fetch doctor
    const doctor = await doctorModel.findById(docId).select("-password");
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    // Check availability
    const slotKey = `${slotDate} ${slotTime}`;
    if (doctor.slots_booked.includes(slotKey)) {
      return res.json({ success: false, message: "Slot already booked" });
    }

    // Fetch user
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Lock slot
    doctor.slots_booked.push(slotKey);
    await doctor.save();

    // ✅ CREATE APPOINTMENT (ALL REQUIRED FIELDS)
    const appointmentData = {
      userId,
      docId,
      slotDate,
      slotTime,

      userData: {
        name: user.name,
        email: user.email,
        image: user.image || "",
        phone: user.phone || ""
      },

      docData: {
        name: doctor.name,
        speciality: doctor.speciality,
        image: doctor.image || "",
        address: doctor.address || {}
      },

      amount: doctor.feeStructure,   // ✅ REQUIRED
      date: Date.now(),              // ✅ REQUIRED
      cancelled: false,
      payment: false,
      isCompleted: false
    };

    await new appointmentModel(appointmentData).save();

    return res.json({
      success: true,
      message: "Appointment Booked Successfully"
    });

  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: error.message
    });
  }
};


//API to get user appointments for frontend my-appointments page

const listAppointment = async (req, res) => {
  try {
    const userId = req.userId;   // token → userId

    const appointments = await appointmentModel
      .find({ userId })
      .sort({ date: -1 });

    return res.json({
      success: true,
      appointments
    });

  } catch (error) {
    return res.json({
      success: false,
      message: error.message
    });
  }
};

// API to cancel appointment 
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointment.userId.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    if (appointment.cancelled) {
      return res.json({ success: false, message: "Appointment already cancelled" });
    }

    // ✅ ALLOW CANCEL EVEN IF PAYMENT IS TRUE
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
    return res.json({ success: false, message: error.message });
  }
};



// ================= MOCK RAZORPAY PAYMENT =================

// API to create mock Razorpay order

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const paymentRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment || appointment.cancelled) {
      return res.json({ success: false, message: "Invalid appointment" });
    }

    if (appointment.userId.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const order = await razorpayInstance.orders.create({
      amount: appointment.amount * 100,
      currency: "INR",
      receipt: appointmentId,
    });

    res.json({ success: true, order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// API to verify mock Razorpay payment
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      appointmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !appointmentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.json({
        success: false,
        message: "Invalid payment data",
      });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.json({
        success: false,
        message: "Appointment not found",
      });
    }

    // 🔐 VERIFY SIGNATURE
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // ✅ SAVE PAYMENT DETAILS
    appointment.payment = true;
    appointment.paymentId = razorpay_payment_id;
    appointment.orderId = razorpay_order_id;
    appointment.signature = razorpay_signature;

    await appointment.save();

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

export default verifyRazorpayPayment;



export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpayPayment };