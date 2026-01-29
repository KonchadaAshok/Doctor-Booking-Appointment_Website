import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = "$";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userData, setUserData] = useState(false);

  /* ✅ Attach token globally */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
    } else {
      delete axios.defaults.headers.common["token"];
    }
  }, [token]);

  /* ✅ Get doctors */
  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/list"
      );

      if (data.doctors) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load doctors");
    }
  };

  /* ✅ Load user profile */
  const loadUserProfileData = async () => {
    try {
      if (!token) return;

      const { data } = await axios.get(
        backendUrl + "/api/user/get-profile"
      );

      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.error(
        "PROFILE LOAD ERROR:",
        error.response?.data || error.message
      );
    }
  };

  /* ✅ Axios auto logout on 401 */
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,

      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setToken("");
          setUserData(false);

          toast.error("Session expired. Please login again.");
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  /* ✅ Load doctors on start */
  useEffect(() => {
    getDoctorsData();
  }, []);

  /* ✅ Load profile when token changes */
  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
