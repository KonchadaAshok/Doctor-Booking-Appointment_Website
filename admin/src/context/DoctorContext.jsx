import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = ({ children }) => {

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") || ""
  );

  const [dashData, setDashData] = useState(false);

  const [profileData, setProfileData] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("dToken");
    if (token) setDToken(token);
  }, []);

  const [appointments, setAppointments] = useState([]);

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/appointments`,
        {
          headers: { token: dToken }
        }
      );

      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const completeAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/complete-appointment`,
        { appointmentId },
        {
          headers: { token: dToken }
        }
      );
      if(data.success) {
        toast.success(data.message);
        getAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/cancel-appointment`,
        { appointmentId },
        {
          headers: { token: dToken }
        }
      );
      if(data.success) {
        toast.success(data.message);
        getAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }

  const getDashData = async () => {
    try {
      const {data} = await axios.get(
        `${backendUrl}/api/doctor/dashboard`,
        {
          headers: { token: dToken }
        }
      );
      if(data.success) {
        setDashData(data.dashData);
        console.log(data.dashData);
        
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }

  const getProfileData = async () => {
    try {
      const {data} = await axios.get(
        `${backendUrl}/api/doctor/profile`,
        {
          headers: { token: dToken }
        }
      );
      if(data.success) {
        setProfileData(data.profileData);
        console.log(data.profileData);
        
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }

  return (
    <DoctorContext.Provider
      value={{
        dToken,
        setDToken,
        backendUrl,
        appointments,
        setAppointments,
        getAppointments,
        completeAppointment,
        cancelAppointment,
        dashData, setDashData, getDashData,
        profileData, setProfileData,
        getProfileData
      }}
    >
      {children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
