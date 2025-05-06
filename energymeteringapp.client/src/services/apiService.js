// src/services/apiService.js
import axios from 'axios';

// Configuration with environment-aware base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7177';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for authentication (future use)
api.interceptors.request.use(config => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Enhanced error handling
api.interceptors.response.use(
    response => response,
    error => {
        let errorMessage = 'An unknown error occurred';

        if (error.response) {
            // Server responded with an error
            errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
        } else if (error.request) {
            // No response received
            errorMessage = 'No response from server. Please check your connection.';
        } else {
            // Request configuration error
            errorMessage = error.message;
        }

        console.error('API Error:', errorMessage);

        return Promise.reject({
            message: errorMessage,
            originalError: error
        });
    }
);

// API methods with consistent error handling
const apiService = {
    // Classifications
    getClassifications: async () => {
        try {
            const response = await api.get('/api/classifications');
            return response.data;
        } catch (error) {
            console.error('Error fetching classifications:', error);
            throw error;
        }
    },

    createClassification: async (classification) => {
        try {
            const response = await api.post('/api/classifications', classification);
            return response.data;
        } catch (error) {
            console.error('Error creating classification:', error);
            throw error;
        }
    },

    // Metering Data
    getMeteringData: async (params = {}) => {
        try {
            const response = await api.get('/api/meteringdata', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching metering data:', error);
            throw error;
        }
    },

    generateData: async (params) => {
        try {
            const response = await api.post('/api/meteringdata/generate', params);
            return response.data;
        } catch (error) {
            console.error('Error generating data:', error);
            throw error;
        }
    },

    // EnPIs
    getEnPIs: async () => {
        try {
            const response = await api.get('/api/enpi');
            return response.data;
        } catch (error) {
            console.error('Error fetching EnPIs:', error);
            throw error;
        }
    },

    calculateEnPI: async (params) => {
        try {
            const response = await api.post('/api/enpi/calculate', params);
            return response.data;
        } catch (error) {
            console.error('Error calculating EnPI:', error);
            throw error;
        }
    }
};

export default apiService;