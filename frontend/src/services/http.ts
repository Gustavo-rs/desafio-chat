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
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || "Erro desconhecido";
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
