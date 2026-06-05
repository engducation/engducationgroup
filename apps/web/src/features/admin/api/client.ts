import axios from "axios";

export const adminApiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ??
      error?.response?.data?.message ??
      error?.message ??
      "Request failed";

    return Promise.reject(new Error(message));
  },
);
