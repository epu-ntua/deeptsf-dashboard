import axios from 'axios';

const baseURL = process.env.REACT_APP_BACKEND_BASE_URL;
// Fix the WebSocket URL - remove potential double-slash issue
const wsURL = process.env.REACT_APP_BACKEND_WS_URL || baseURL?.replace('https://', 'wss://').replace('http://', 'ws://');

// Modify the default headers
const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

// Set global axios default timeout to 15 minutes (for all requests, including file uploads)
axios.defaults.timeout = 15 * 60 * 1000;

// Create axios instance with credentials support
const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: defaultHeaders,
    withCredentials: true, // Enable credentials
    timeout: 30000, // Increase timeout for larger file uploads
    // Add proper CORS handling
    validateStatus: function (status) {
        return status >= 200 && status < 300; // Accept only success status codes
    }
});

// Modify request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Check for Keycloak token first
        const keycloakToken = localStorage.getItem('keycloakToken');
        const virtoToken = localStorage.getItem('virtoToken');
        const authMethod = localStorage.getItem('authMethod');
        
        // Apply appropriate auth token based on auth method
        if (authMethod === 'keycloak' && keycloakToken) {
            config.headers.Authorization = `Bearer ${keycloakToken}`;
        } else if (authMethod === 'virto' && virtoToken && !config.url.endsWith('/api/login')) {
            config.headers.Authorization = `Bearer ${virtoToken}`;
        }
        
        // Handle file uploads
        if (config.url?.includes('upload') && config.method === 'post') {
            // Remove Content-Type for FormData/file uploads
            delete config.headers['Content-Type'];
        } else if (config.method === 'post') {
            config.headers['Content-Type'] = 'application/json';
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor with retry logic
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle specific error cases
        if (error.response?.status === 401) {
            // Handle unauthorized - maybe refresh token or redirect to login
            console.error('Unauthorized access');
            
            // Check if unauthorized due to expired token
            const authMethod = localStorage.getItem('authMethod');
            if (authMethod === 'keycloak' || authMethod === 'virto') {
                // Redirect to keycloak login
                window.location.href = '/';
            }
            return Promise.reject(new Error('Unauthorized access'));
        }

        // If error is CORS or Network related
        if ((error.response?.status === 0 || error.code === 'ERR_NETWORK') && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Wait a bit before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await axiosInstance(originalRequest);
            } catch (retryError) {
                console.error('Request failed after retry:', {
                    url: originalRequest.url,
                    method: originalRequest.method,
                    error: retryError.message
                });
                return Promise.reject(retryError);
            }
        }

        // Log detailed error information
        console.error('API Error:', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
            message: error.message,
            response: error.response?.data
        });

        return Promise.reject(error);
    }
);

// Create a websocket connection helper
export const createTaskWebSocket = (taskId, token, callbacks = {}) => {
    if (!wsURL) {
        console.error('WebSocket URL is not configured');
        if (callbacks.onError) callbacks.onError(new Error('WebSocket URL is not configured'));
        return null;
    }
    
    try {
        // Fix the WebSocket URL path construction to match backend
        // Avoid double-slashes when combining base URL with path
        const socketUrl = `${wsURL}/ws/task-status/${taskId}?token=${token}`.replace(/([^:]\/)\/+/g, "$1");
        console.log('Connecting to WebSocket URL:', socketUrl);
        
        const socket = new WebSocket(socketUrl);
        
        socket.onopen = () => {
            console.log('WebSocket connection established');
            if (callbacks.onOpen) callbacks.onOpen();
        };
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);
                if (callbacks.onMessage) callbacks.onMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                if (callbacks.onError) callbacks.onError(error);
            }
        };
        
        socket.onerror = (event) => {
            console.error('WebSocket error:', event);
            if (callbacks.onError) callbacks.onError(event);
        };
        
        socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
            if (callbacks.onClose) callbacks.onClose(event);
        };
        
        return socket;
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        if (callbacks.onError) callbacks.onError(error);
        return null;
    }
};

export default axiosInstance;

// Create second instance with same configuration
export const axiosSecond = axios.create({
    baseURL: baseURL,
    headers: defaultHeaders,
    withCredentials: true,
    timeout: 30000, // Increase timeout for larger file uploads
    validateStatus: function (status) {
        return status >= 200 && status < 300;
    }
});

// Apply same interceptors to second instance
axiosSecond.interceptors.request.use(
    axiosInstance.interceptors.request.handlers[0].fulfilled,
    axiosInstance.interceptors.request.handlers[0].rejected
);

axiosSecond.interceptors.response.use(
    axiosInstance.interceptors.response.handlers[0].fulfilled,
    axiosInstance.interceptors.response.handlers[0].rejected
);