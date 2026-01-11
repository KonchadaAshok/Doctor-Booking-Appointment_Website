import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { toast } from "react-toastify";
import axios from "axios";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  // Fetch doctor info
  useEffect(() => {
    const doctor = doctors?.find((doc) => doc._id === docId);
    if (doctor) setDocInfo(doctor);
  }, [doctors, docId]);

  // Generate available slots safely
 useEffect(() => {
  if (!docInfo) return;

  // 🚫 Doctor unavailable → no slots
  if (!docInfo.availability) {
    setDocSlots([]);
    setSlotTime("");
    return;
  }

  const generateSlots = () => {
    const slotsArray = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const startHour = i === 0 ? Math.max(today.getHours() + 1, 10) : 10;
      currentDate.setHours(startHour, 0, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      const daySlots = [];

      while (currentDate < endTime) {
        const time = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const day = String(currentDate.getDate()).padStart(2, "0");
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const year = currentDate.getFullYear();
        const slotDate = `${day}_${month}_${year}`;

        const slotKey = `${slotDate} ${time}`;
        const isBooked = docInfo?.slots_booked?.includes(slotKey);

        if (!isBooked) {
          daySlots.push({
            datetime: new Date(currentDate),
            time,
            slotDate,
          });
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      slotsArray.push(daySlots);
    }

    setDocSlots(slotsArray);
  };

  generateSlots();
}, [docInfo]);


  // Book appointment
  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Login to book appointment");
      return navigate("/login");
    }

    if (!slotTime || !docSlots[slotIndex]?.length) {
      toast.warn("Select a valid time slot");
      return;
    }

    try {
      const selectedSlot = docSlots[slotIndex].find((s) => s.time === slotTime);
      if (!selectedSlot) {
        toast.error("Selected slot is not available");
        return;
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        {
          docId,
          slotDate: selectedSlot.slotDate,
          slotTime: selectedSlot.time,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success(data.message);

        // refresh doctor slots globally
        await axios.get(`${backendUrl}/api/doctor/list`);

        setSlotTime("");
        navigate("/my-appointments");
      }
      else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("BOOK ERROR:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Booking failed");
    }
  };

  if (!docInfo) return <p>Loading doctor info...</p>;

  return (
    <div>
      {/* Doctor Details */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img className="bg-primary w-full sm:max-w-72 rounded-lg" src={docInfo?.image} alt={docInfo?.name} />
        </div>
        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
            {docInfo?.name}
            <img className="w-5" src={assets.verified_icon} alt="verified" />
          </p>
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>
              {docInfo?.degree} - {docInfo?.speciality}
            </p>
            <button className="py-0.5 px-2 border text-xs rounded-full">{docInfo?.experience}</button>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
              About <img src={assets.info_icon} alt="info" />
            </p>
            <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo?.about?.description || docInfo?.about}</p>
          </div>
          <p className="text-gray-500 font-medium mt-4">
            Appointment fee:{" "}
            <span className="text-gray-600">
              {currencySymbol}
              {docInfo?.feeStructure}
            </span>
          </p>
        </div>
      </div>

      {/* Booking Slots */}
      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking slots</p>

        {/* Dates */}
        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
          {docSlots.map((daySlots, index) => (
            <div
              key={index}
              onClick={() => setSlotIndex(index)}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? "bg-primary text-white" : "border border-gray-200"
                }`}
            >
              <p>{daySlots[0] && daysOfWeek[daySlots[0].datetime.getDay()]}</p>
              <p>{daySlots[0] && daySlots[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
          {docSlots[slotIndex]?.length > 0 ? (
            docSlots[slotIndex].map((slot) => (
              <p
                key={slot.time}
                onClick={() => setSlotTime(slot.time)}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${slot.time === slotTime ? "bg-primary text-white" : "text-gray-400 border border-gray-300"
                  }`}
              >
                {slot.time.toLowerCase()}
              </p>
            ))
          ) : (
            <p className="text-gray-500">No slots available</p>
          )}
        </div>

        <button
          onClick={bookAppointment}
          className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6"
        >
          Book an appointment
        </button>
      </div>

      {/* Related Doctors */}
      <RelatedDoctors docId={docId} speciality={docInfo?.speciality} />
    </div>
  );
};

export default Appointment;
