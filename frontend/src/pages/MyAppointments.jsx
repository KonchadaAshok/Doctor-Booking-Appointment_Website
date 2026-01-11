import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const slotDateFormat = (slotDate) => {
    const [day, month, year] = slotDate.split("_");
    return `${day} ${months[Number(month)]} ${year}`;
  };

  const navigate = useNavigate();
  // ================= GET APPOINTMENTS =================
  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/user/appointments",
        {
          headers: { token }
        }
      );

      if (data.success) {
        const sortedAppointments = data.appointments.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setAppointments(sortedAppointments);

      }

    } catch (error) {
      console.error(error);
      toast.error("Unauthorized");
    }
  };

  // ================= CANCEL =================
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointment",
        { appointmentId },
        { headers: { token } }
      );
      
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Cancel failed");
    }
  };

  // ================= RAZORPAY =================
  const appointmentRazorpay = async (appointmentId) => {
    try {
      // 1️⃣ Create order
      const { data } = await axios.post(
        backendUrl + "/api/user/payment-razorpay",
        { appointmentId },
        { headers: { token } }

      );

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      console.log("ORDER CREATED:", data.order); // ✅ YOU WILL SEE order_id HERE

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "Doctor Appointment",
        description: "Appointment Payment",
        order_id: data.order.id, // ✅ VERY IMPORTANT
        receipt: data.order.receipt,

        handler: async function (response) {
          console.log("PAYMENT RESPONSE:", response); // ✅ SEE order_id HERE

          try {
            const verifyRes = await axios.post(
              backendUrl + "/api/user/payment-verify",
              {
                appointmentId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  token: token // 🔥 THIS FIXES YOUR ISSUE
                }
              }
            );

            if (verifyRes.data.success) {
              toast.success("Payment Successful");
              getUserAppointments();
              getDoctorsData();
              navigate("/my-appointments");
            } else {
              toast.error(verifyRes.data.message);
            }
          } catch {
            toast.error("Payment verification failed");
          }
        },

        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error("Payment failed");
    }
  };

  useEffect(() => {
    if (token) getUserAppointments();
  }, [token]);

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My Appointments
      </p>

      {appointments.map((item) => (
        <div key={item._id} className="grid sm:flex gap-6 py-4 border-b">
          <img className="w-32 bg-indigo-50" src={item.docData.image} />

          <div className="flex-1 text-sm">
            <p className="font-semibold">{item.docData.name}</p>
            <p>{item.docData.speciality}</p>
            <p className="mt-1">
              <b>Date & Time:</b> {slotDateFormat(item.slotDate)} | {item.slotTime}
            </p>
          </div>

          <div className='flex flex-col gap-2 justify-end'>
            {!item.cancelled && !item.payment && !item.isCompleted && (
              <button
                onClick={() => appointmentRazorpay(item._id, item.amount)}
                className='text-sm text-stone-500 sm:min-w-48 py-2 border hover:bg-blue-600 hover:text-white transition-all'
              >
                Pay Online
              </button>
            )}

            {!item.cancelled && item.payment && !item.isCompleted && (
              <button className='sm:min-w-48 py-2 border border-green-500 text-green-600'>
                Paid
              </button>
            )}



            {!item.cancelled && !item.isCompleted && (
              <button
                onClick={() => cancelAppointment(item._id)}
                className='text-sm text-stone-500 sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all'
              >
                Cancel appointment
              </button>
            )}


            {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>
              Appointment cancelled
            </button>}
            {item.isCompleted && <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">Completed</button>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyAppointments;
