import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Add global error handling (e.g., redirect to login on 401)
    return Promise.reject(error);
  }
);

export default apiClient;
