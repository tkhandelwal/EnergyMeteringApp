// src/components/DataGenerator.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import moment from 'moment';

const DataGenerator = () => {
    const [classifications, setClassifications] = useState([]);
    const [formData, setFormData] = useState({
        classificationId: '',
        startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        intervalMinutes: 15,
        baseValue: 10,
        variance: 2
    });
    const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

    useEffect(() => {
        fetchClassifications();
    }, []);

    const fetchClassifications = async () => {
        try {
            const response = await axios.get('/api/classifications');
            console.log('Fetched classifications:', response.data);

            // Adjust this if the response shape is { classifications: [...] }
            // setClassifications(response.data.classifications);
            setClassifications(response.data);

            if (Array.isArray(response.data) && response.data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    classificationId: response.data[0].id
                }));
            }
        } catch (error) {
            console.error('Error fetching classifications:', error);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate)
            };

            await axios.post('/api/meteringdata/generate', payload);
            setAlert({
                show: true,
                message: 'Synthetic data generated successfully!',
                variant: 'success'
            });

            setTimeout(() => {
                setAlert({ show: false, message: '', variant: '' });
            }, 3000);
        } catch (error) {
            console.error('Error generating data:', error);
            setAlert({
                show: true,
                message: `Error: ${error.response?.data || 'Failed to generate data'}`,
                variant: 'danger'
            });
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

                        <Button variant="primary" type="submit">
                            Generate Data
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default DataGenerator;
