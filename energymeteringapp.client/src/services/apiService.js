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

// Create a fallback API for when the main API fails
const fallbackApi = axios.create({
    baseURL: 'https://localhost:7177', // Use HTTPS instead of HTTP
    timeout: 5000,
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
    // System Health
    checkHealth: async () => {
        try {
            // Try to reach the API
            await api.get('/api/health');
            return { status: 'ok', message: 'API is responsive' };
        } catch (error) {
            if (error.originalError && error.originalError.response) {
                // At least the server responded with an error
                return { status: 'warning', message: 'API is reachable but returned an error' };
            } else {
                // Server is not responding at all
                return { status: 'error', message: 'API is not responding' };
            }
        }
    },

    // Baselines
    createBaseline: async (baseline) => {
        try {
            const response = await api.post('/api/baselines', baseline);
            return response.data;
        } catch (error) {
            console.error('Error creating baseline:', error);
            throw error;
        }
    },

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

    getBaselines: async () => {
        try {
            const response = await api.get('/api/baselines');
            return response.data;
        } catch (error) {
            console.error('Error fetching baselines:', error);
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

    deleteClassification: async (id) => {
        try {
            const response = await api.delete(`/api/classifications/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting classification:', error);
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
    },

    deleteEnPI: async (id) => {
        try {
            const response = await api.delete(`/api/enpi/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting EnPI:', error);
            throw error;
        }
    },

    // EnPI definitions
    createEnPIDefinition: async (enpiDefinition) => {
        try {
            const response = await api.post('/api/enpidefinitions', enpiDefinition);
            return response.data;
        } catch (error) {
            console.error('Error creating EnPI definition:', error);
            throw error;
        }
    },

    getEnPIDefinitions: async () => {
        try {
            const response = await api.get('/api/enpidefinitions');
            return response.data;
        } catch (error) {
            console.error('Error fetching EnPI definitions:', error);
            throw error;
        }
    },

    // Targets
    createTarget: async (target) => {
        try {
            const response = await api.post('/api/targets', target);
            return response.data;
        } catch (error) {
            console.error('Error creating target:', error);
            throw error;
        }
    },

    getTargets: async () => {
        try {
            const response = await api.get('/api/targets');
            return response.data;
        } catch (error) {
            console.error('Error fetching targets:', error);
            throw error;
        }
    },

    // Fallback methods
    fallback: {
        getClassifications: async () => {
            try {
                const response = await fallbackApi.get('/api/classifications');
                return response.data;
            } catch (error) {
                console.error('Fallback API error:', error);
                throw error;
            }
        },

        getMeteringData: async (params = {}) => {
            try {
                const response = await fallbackApi.get('/api/meteringdata', { params });
                return response.data;
            } catch (error) {
                console.error('Fallback API error:', error);
                throw error;
            }
        },

        getEnPIs: async () => {
            try {
                const response = await fallbackApi.get('/api/enpi');
                return response.data;
            } catch (error) {
                console.error('Fallback API error:', error);
                throw error;
            }
        },

        checkHealth: async () => {
            try {
                await fallbackApi.get('/api/health');
                return { status: 'ok', message: 'Fallback API is responsive' };
            } catch {
                return { status: 'error', message: 'All API endpoints are down' };
            }
        }
    }
};

export default apiService;