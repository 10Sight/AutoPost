import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://autopost-server-8yze.onrender.com/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Response Interceptor: Handle 401
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                await axios.post(
                    `${import.meta.env.VITE_API_URL || "https://autopost-server-8yze.onrender.com"}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                // If refresh success, retry original request
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login
                window.location.href = "/auth/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
