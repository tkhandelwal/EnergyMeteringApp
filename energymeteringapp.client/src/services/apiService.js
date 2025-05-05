// Modified apiService.js with improved error handling
import axios from 'axios';

// Create an axios instance with updated config
const api = axios.create({
    timeout: 30000, // Increase timeout to 30 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to execute API calls with retry logic
const executeWithRetry = async (apiCall, retries = 0) => {
    try {
        return await apiCall();
    } catch (error) {
        console.error(`API Error (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error.message || 'Unknown error');

        if (retries < MAX_RETRIES) {
            console.log(`API call failed, retrying in ${RETRY_DELAY / 1000}s (${retries + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return executeWithRetry(apiCall, retries + 1);
        }

        // If we've exhausted retries, throw a friendly error
        const userFriendlyError = {
            message: "Could not connect to the server. Please check if the backend is running.",
            originalError: error
        };
        throw userFriendlyError;
    }
};

// Add response interceptor for global error handling
api.interceptors.response.use(
    response => response,
    error => {
        let errorMessage = 'An unknown error occurred';
        if (error.response) {
            errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
        } else if (error.request) {
            errorMessage = `No response from server (${error.message}). Please check your connection.`;
        } else {
            errorMessage = error.message;
        }

        // Return a rejected promise with structured error
        return Promise.reject({
            originalError: error,
            message: errorMessage
        });
    }
);

// API methods
const apiService = {
    // Classifications
    getClassifications: async () => {
        return executeWithRetry(async () => {
            const response = await api.get('/api/classifications');
            return response.data;
        });
    },

    createClassification: async (classification) => {
        return executeWithRetry(async () => {
            const response = await api.post('/api/classifications', classification);
            return response.data;
        });
    },

    deleteClassification: async (id) => {
        return executeWithRetry(async () => {
            const response = await api.delete(`/api/classifications/${id}`);
            return response.data;
        });
    },

    // Metering Data
    getMeteringData: async () => {
        return executeWithRetry(async () => {
            const response = await api.get('/api/meteringdata');
            return response.data;
        });
    },

    generateData: async (params) => {
        return executeWithRetry(async () => {
            const response = await api.post('/api/meteringdata/generate', params);
            return response.data;
        });
    },

    // EnPIs
    getEnPIs: async () => {
        return executeWithRetry(async () => {
            const response = await api.get('/api/enpi');
            return response.data;
        });
    },

    calculateEnPI: async (params) => {
        return executeWithRetry(async () => {
            const response = await api.post('/api/enpi/calculate', params);
            return response.data;
        });
    },

    deleteEnPI: async (id) => {
        return executeWithRetry(async () => {
            const response = await api.delete(`/api/enpi/${id}`);
            return response.data;
        });
    },

    // Fallback methods - use these if the primary API fails
    fallback: {
        getClassifications: async () => {
            return executeWithRetry(async () => {
                const response = await api.get('/fallback-api/classifications');
                return response.data;
            });
        },

        getMeteringData: async () => {
            return executeWithRetry(async () => {
                const response = await api.get('/fallback-api/meteringdata');
                return response.data;
            });
        },

        getEnPIs: async () => {
            return executeWithRetry(async () => {
                const response = await api.get('/fallback-api/enpi');
                return response.data;
            });
        }
    },

    // Health check - useful for system status page
    checkHealth: async () => {
        try {
            await api.get('/api/classifications');
            return { status: 'ok', message: 'API is reachable' };
        } catch (_error) {
            try {
                // Try fallback
                await api.get('/fallback-api/classifications');
                return { status: 'warning', message: 'Primary API failed, fallback working' };
            } catch (_fallbackError) {
                return { status: 'error', message: 'API is unreachable' };
            }
        }
    }
};

export default apiService;