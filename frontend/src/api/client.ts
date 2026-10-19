import axios from "axios";

/** Dispatched on window when the API answers 403 for a missing permission. */
export const FORBIDDEN_EVENT = "autotech:forbidden";

const PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function redirectToChangePassword() {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    localStorage.setItem(
      "user",
      JSON.stringify({ ...JSON.parse(storedUser), mustChangePassword: true })
    );
  }
  if (window.location.pathname !== "/change-password") {
    window.location.href = "/change-password";
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Basic redirect that avoids circular dependencies with react-router
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (error.response && error.response.status === 403) {
      if (error.response.data?.data?.code === PASSWORD_CHANGE_REQUIRED) {
        redirectToChangePassword();
      } else {
        window.dispatchEvent(new Event(FORBIDDEN_EVENT));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
