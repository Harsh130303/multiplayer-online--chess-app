import axios from 'axios';

const client = axios.create({
    baseURL: `${window.location.protocol}//${window.location.host}/api`,
});

// Add a request interceptor to include the token
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle unauthorized errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login'; // Redirect to login
        }
        return Promise.reject(error);
    }
);

export default client;
