import axios from "axios";
import { toast } from "sonner";
import { config } from "@/config/env";

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || "Erro desconhecido";

    if (message) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
