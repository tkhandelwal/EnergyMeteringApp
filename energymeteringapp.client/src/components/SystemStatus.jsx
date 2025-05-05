// src/components/SystemStatus.jsx
import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import apiService from '../services/apiService';

const SystemStatus = () => {
    const [statuses, setStatuses] = useState({
        backend: { status: 'unknown', message: 'Not checked yet' },
        classifications: { status: 'unknown', message: 'Not checked yet' },
        meteringData: { status: 'unknown', message: 'Not checked yet' }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkBackend = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = { ...statuses };

            // Check API health
            try {
                const healthCheck = await apiService.checkHealth();
                result.backend = healthCheck;
            } catch (error) {
                result.backend = {
                    status: 'error',
                    message: `Backend API error: ${error.message || 'Unknown error'}`
                };
            }

            // Check classifications
            try {
                const classifications = await apiService.getClassifications();
                const count = Array.isArray(classifications) ? classifications.length : 0;
                result.classifications = {
                    status: count > 0 ? 'ok' : 'warning',
                    message: count > 0 ?
                        `Found ${count} classifications` :
                        'No classifications found'
                };
            } catch (error) {
                result.classifications = {
                    status: 'error',
                    message: 'Failed to fetch classifications'
                };
            }

            // Check metering data
            try {
                const meteringData = await apiService.getMeteringData();
                const count = Array.isArray(meteringData) ? meteringData.length : 0;
                result.meteringData = {
                    status: 'ok',
                    message: `Found ${count} metering data points`
                };
            } catch (error) {
                result.meteringData = {
                    status: 'error',
                    message: 'Failed to fetch metering data'
                };
            }

            setStatuses(result);
        } catch (error) {
            console.error('Error checking system status:', error);
            setError('Failed to check system status: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkBackend();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ok':
                return <Badge bg="success">OK</Badge>;
            case 'warning':
                return <Badge bg="warning">Warning</Badge>;
            case 'error':
                return <Badge bg="danger">Error</Badge>;
            default:
                return <Badge bg="secondary">Unknown</Badge>;
        }
    };

    const createDefaultClassifications = async () => {
        setLoading(true);
        try {
            // Default classifications
            const defaults = [
                { name: "Main Building", type: "Facility" },
                { name: "Server Room", type: "Equipment" },
                { name: "Production Line A", type: "ProductionLine" }
            ];

            // Create each default classification
            for (const classification of defaults) {
                await apiService.createClassification(classification);
            }

            // Refresh status
            await checkBackend();
            setError(null);
        } catch (error) {
            console.error('Error creating default classifications:', error);
            setError('Failed to create default classifications: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const generateSampleData = async () => {
        setLoading(true);
        try {
            // Check if we have classifications
            const classifications = await apiService.getClassifications();
            if (!Array.isArray(classifications) || classifications.length === 0) {
                setError('Please create classifications first before generating data');
                return;
            }

            // Generate data for each classification
            for (const classification of classifications) {
                const params = {
                    classificationId: classification.id,
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    endDate: new Date(),
                    intervalMinutes: 15,
                    baseValue: 10,
                    variance: 2
                };

                await apiService.generateData(params);
            }

            // Refresh status
            await checkBackend();
            setError(null);
        } catch (error) {
            console.error('Error generating sample data:', error);
            setError('Failed to generate sample data: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>System Status</h2>

            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>System Components</Card.Title>
                    {loading && statuses.backend.status === 'unknown' ? (
                        <div className="text-center my-4">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <p className="mt-2">Checking system status...</p>
                        </div>
                    ) : (
                        <>
                            <ListGroup className="mb-3">
                                {Object.entries(statuses).map(([key, value]) => (
                                    <ListGroup.Item key={key} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong className="text-capitalize">{key}</strong>: {value.message}
                                        </div>
                                        {getStatusBadge(value.status)}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>

                            <div className="d-flex flex-wrap gap-2">
                                <Button
                                    variant="primary"
                                    onClick={checkBackend}
                                    disabled={loading}
                                >
                                    {loading ? 'Checking...' : 'Refresh Status'}
                                </Button>

                                <Button
                                    variant="success"
                                    onClick={createDefaultClassifications}
                                    disabled={loading || statuses.classifications.status === 'ok'}
                                >
                                    Create Default Classifications
                                </Button>

                                <Button
                                    variant="info"
                                    onClick={generateSampleData}
                                    disabled={loading || statuses.classifications.status !== 'ok'}
                                >
                                    Generate Sample Data
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <Card.Title>Troubleshooting</Card.Title>
                    <p>If you're experiencing connection issues:</p>
                    <ol>
                        <li>Make sure the backend server is running (check console output)</li>
                        <li>Verify that the API endpoints are correctly configured</li>
                        <li>Check for CORS issues in the browser console</li>
                        <li>Try restarting both the frontend and backend servers</li>
                    </ol>
                    <p>
                        <strong>Backend URLs:</strong><br />
                        HTTPS: https://localhost:7177<br />
                        HTTP: http://localhost:5255
                    </p>
                </Card.Body>
            </Card>
        </div>
    );
};

export default SystemStatus;