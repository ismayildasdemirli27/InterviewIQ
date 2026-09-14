import axios from "axios";
import { handleMockFallback } from "./mockFallback";

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? "https://server-lime-eta.vercel.app/api/v1"
      : "http://localhost:5000/api/v1"),
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend is unreachable (e.g. Mixed Content block on Vercel, offline dev server, network error)
    if (!error.response || error.code === "ERR_NETWORK" || error.response?.status >= 500) {
      const fallbackResponse = handleMockFallback(error.config);
      if (fallbackResponse) {
        console.info(
          `⚡ [InterviewIQ Demo Fallback] Handled ${error.config?.method?.toUpperCase()} ${error.config?.url} gracefully.`
        );
        return Promise.resolve(fallbackResponse);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;