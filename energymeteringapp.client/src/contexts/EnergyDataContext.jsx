// src/contexts/EnergyDataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const EnergyDataContext = createContext();

export const useEnergyData = () => useContext(EnergyDataContext);

export const EnergyDataProvider = ({ children }) => {
    const [classifications, setClassifications] = useState([]);
    const [meteringData, setMeteringData] = useState([]);
    const [enpiList, setEnpiList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load initial data
    useEffect(() => {
        fetchClassifications();
        fetchMeteringData();
        fetchEnPIs();
    }, []);

    const fetchClassifications = async () => {
        setLoading(true);
        try {
            const data = await apiService.getClassifications();
            setClassifications(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load classifications');
        } finally {
            setLoading(false);
        }
    };

    const fetchMeteringData = async () => {
        setLoading(true);
        try {
            const data = await apiService.getMeteringData();
            setMeteringData(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load metering data');
        } finally {
            setLoading(false);
        }
    };

    const fetchEnPIs = async () => {
        setLoading(true);
        try {
            const data = await apiService.getEnPIs();
            setEnpiList(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load EnPIs');
        } finally {
            setLoading(false);
        }
    };

    // Add classification
    const addClassification = async (classification) => {
        setLoading(true);
        try {
            await apiService.createClassification(classification);
            await fetchClassifications(); // Refresh the list
            setError(null);
            return true;
        } catch (err) {
            setError(err.message || 'Failed to add classification');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Generate data
    const generateMeteringData = async (params) => {
        setLoading(true);
        try {
            await apiService.generateData(params);
            await fetchMeteringData(); // Refresh the data
            setError(null);
            return true;
        } catch (err) {
            setError(err.message || 'Failed to generate metering data');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Calculate EnPI
    const calculateEnPI = async (params) => {
        setLoading(true);
        try {
            await apiService.calculateEnPI(params);
            await fetchEnPIs(); // Refresh the list
            setError(null);
            return true;
        } catch (err) {
            setError(err.message || 'Failed to calculate EnPI');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnergyDataContext.Provider
            value={{
                classifications,
                meteringData,
                enpiList,
                loading,
                error,
                fetchClassifications,
                fetchMeteringData,
                fetchEnPIs,
                addClassification,
                generateMeteringData,
                calculateEnPI,
                clearError: () => setError(null)
            }}
        >
            {children}
        </EnergyDataContext.Provider>
    );
};

export default EnergyDataProvider;