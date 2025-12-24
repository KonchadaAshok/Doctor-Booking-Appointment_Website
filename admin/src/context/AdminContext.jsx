import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect } from "react";

export const AdminContext = createContext();

const AdminContextProvider = ({ children }) => {

  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") || ""
  );

  useEffect(() => {
    const token = localStorage.getItem("aToken");
    if (token) setAToken(token);
  }, []);

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(null);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const getAllDoctors = async () => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/admin/all-doctors`,
      {}, // POST body can be empty
      {
        headers: { token: aToken }
      }
    );

    if (data.success) setDoctors(data.doctors);
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
  }
};



  const changeAvailability = async (id, available) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/admin/doctors/${id}/availability`,
        { availability: available },
        { headers: { token: aToken } }
      );

      if (data.success) {
        setDoctors((prev) =>
          prev.map((doc) => (doc._id === id ? { ...doc, availability: available } : doc))
        );
        toast.success("Availability updated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getAllAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/appointments`, {
        headers: { token: aToken }
      });
      if (data.success) setAppointments(data.appointments);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };


  const cancelAppointment = async (appointmentId) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/admin/cancel-appointment`,
      { appointmentId },   // ✅ FIXED
      {
        headers: { token: aToken }
      }
    );

    if (data.success) {
      setAppointments(prev =>
        prev.map(app =>
          app._id === appointmentId
            ? { ...app, cancelled: true }
            : app
        )
      );
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
  }
};

  const getDashData = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/dashboard`,
        {
          headers: { token: aToken }
        }
      );

      if (data.success) setDashData(data.dashData);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        aToken,
        setAToken,
        doctors,
        appointments,
        dashData,
        getDashData,
        getAllDoctors,          // if you fixed DoctorsList
        changeAvailability,     // if you fixed DoctorsList
        getAllAppointments,     // <-- add this
        cancelAppointment,      // <-- add this
        backendUrl
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
