import mongoose from "mongoose";
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: Number, required: true },
    about: { type: String, default: "" },
    availability: { type: Boolean, default: true },
    feeStructure: { type: Number, required: true },
    address: {
        line1: { type: String, required: true },
        line2: { type: String, required: true }
    },
    date: { type: Date, default: Date.now },
    slots_booked: { type: Array, default: [] }
},
    { minimize: false })
const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema);

export default doctorModel