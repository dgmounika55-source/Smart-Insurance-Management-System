import api from "./api";

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const confirmEmail = async (data) => {
  const response = await api.post("/auth/confirm-email", data);
  return response.data;
};
