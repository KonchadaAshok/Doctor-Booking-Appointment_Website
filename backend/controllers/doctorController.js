import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js";

const changeAvailability = async (req, res) => {
    try {
        const { docId, value } = req.body; // value = true/false

        await doctorModel.findByIdAndUpdate(docId, { availability: value });

        res.json({ success: true, message: "Availability Updated" });
    }
    catch (error) {
        console.error("Error updating availability:", error);
        res.json({ success: false, message: error.message });
    }
};

const doctorList = async (req,res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password','-email'])

        res.json({success:true,doctors})
    }
    catch (error) {
        console.error("Error updating availability:", error);
        res.json({ success: false, message: error.message });
    }
}

//API for doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: doctor._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error("Doctor login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//API to get doctor appointments to doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.docId; // ✅ from JWT middleware

    const appointments = await appointmentModel.find({ docId }).populate("userId", "name image dob");

    res.json({
      success: true,
      appointments
    });

  } catch (error) {
    console.error("Doctor appointments error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const docId = req.docId; // ✅ from JWT
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.docId.toString() !== docId) {
      return res.json({ success: false, message: "Unauthorized doctor" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true
    });

    res.json({
      success: true,
      message: "Appointment marked as completed"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const docId = req.docId; // ✅ from JWT
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.docId.toString() !== docId) {
      return res.json({ success: false, message: "Unauthorized doctor" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true
    });

    res.json({
      success: true,
      message: "Appointment marked as cancelled"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//API to get dashboard data for doctor panel

const doctorDashboard = async (req, res) => {
  try {
    const docId = req.docId; // ✅ from JWT middleware

    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;
    appointments.forEach(item => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    const patients = [];
    appointments.forEach(item => {
      if (!patients.includes(item.userId.toString())) {
        patients.push(item.userId.toString());
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5)
    };

    res.json({
      success: true,
      dashData
    });

  } catch (error) {
    console.error("Doctor dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
  try {
    const docId = req.docId;
    const profileData = await doctorModel.findById(docId).select('-password')
    res.json({success: true, profileData})
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

//API to update doctor profile for doctor panel
// ✅ NEW SAFE CODE
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.docId;
    const { address, feeStructure, availability } = req.body;

    const updateData = {};

    if (address?.line1 !== undefined) {
      updateData["address.line1"] = address.line1;
    }

    if (address?.line2 !== undefined) {
      updateData["address.line2"] = address.line2;
    }

    if (feeStructure !== undefined) {
      updateData.feeStructure = Number(feeStructure);
    }

    if (availability !== undefined) {
      updateData.availability = Boolean(availability);
    }

    // ✅ IMPORTANT: new:true
    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      docId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Profile Updated Successfully",
      profileData: updatedDoctor   // ✅ RETURN UPDATED DATA
    });

  } catch (error) {
    console.error("Update doctor profile error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



export {changeAvailability, doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile}