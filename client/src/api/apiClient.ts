import axios from "axios";

const defaultBaseUrl = import.meta.env.PROD
  ? "/api/v1"
  : "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "interviewiq_token"
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] =
        "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;