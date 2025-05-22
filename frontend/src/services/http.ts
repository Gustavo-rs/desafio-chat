import axios from "axios";
import { toast } from "sonner";

const http = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    toast.success((response.data as { message?: string }).message || "Operação realizada com sucesso");
    return response;
  },
  (error) => {
    switch (error.status) {
      case 401:
        toast.error(error.response.data.message);
        break;
      case 400:
        toast.error(error.response.data.message);
        break;
      case 404:
        toast.error(error.response.data.message);
        break;
      case 500:
        toast.error(error.response.data.message);
        break;
    }
    return Promise.reject(error);
  }
);

export default http;
