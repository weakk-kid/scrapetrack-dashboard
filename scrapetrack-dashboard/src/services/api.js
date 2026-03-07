import axios from "axios";

const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createJob = async (url) => {
  const response = await api.post("/jobs", { url });
  return response.data;
};

export const fetchJobs = async () => {
  const response = await api.get("/jobs");
  return response.data;
};

export const fetchJobById = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export default api;
