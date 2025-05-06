// Updated DataGenerator.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import moment from 'moment';
import { useEnergyData } from '../contexts/EnergyDataContext';
import apiService from '../services/apiService';

const DataGenerator = () => {
    const { classifications, fetchClassifications, fetchMeteringData } = useEnergyData();
    const [formData, setFormData] = useState({
        classificationId: '',
        startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        intervalMinutes: 15,
        baseValue: 10,
        variance: 2
    });
    const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If classifications aren't loaded yet, fetch them
        if (classifications.length === 0) {
            fetchClassifications();
        } else if (formData.classificationId === '' && classifications.length > 0) {
            // Set default classification if available
            setFormData(prev => ({
                ...prev,
                classificationId: classifications[0].id
            }));
        }
    }, [classifications, fetchClassifications, formData.classificationId]);

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate)
            };

            await apiService.generateData(payload);
            setAlert({
                show: true,
                message: 'Synthetic data generated successfully!',
                variant: 'success'
            });

            // Refresh the metering data in the context
            fetchMeteringData();

            setTimeout(() => {
                setAlert({ show: false, message: '', variant: '' });
            }, 3000);
        } catch (error) {
            console.error('Error generating data:', error);
            setAlert({
                show: true,
                message: `Error: ${error.message || 'Failed to generate data'}`,
                variant: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Synthetic Data Generator</h2>
            {alert.show && (
                <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
                    {alert.message}
                </Alert>
            )}
            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Classification</Form.Label>
                            <Form.Select
                                name="classificationId"
                                value={formData.classificationId}
                                onChange={handleChange}
                                required
                            >
                                {Array.isArray(classifications) && classifications.map(classification => (
                                    <option key={classification.id} value={classification.id}>
                                        {classification.name} ({classification.type})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Interval (minutes)</Form.Label>
                            <Form.Control
                                type="number"
                                name="intervalMinutes"
                                value={formData.intervalMinutes}
                                onChange={handleChange}
                                min="1"
                                max="60"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Base Value (kWh)</Form.Label>
                            <Form.Control
                                type="number"
                                name="baseValue"
                                value={formData.baseValue}
                                onChange={handleChange}
                                min="0.1"
                                step="0.1"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Variance</Form.Label>
                            <Form.Control
                                type="number"
                                name="variance"
                                value={formData.variance}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Data'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default DataGenerator;