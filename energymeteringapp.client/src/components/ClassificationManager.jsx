// src/components/ClassificationManager.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import apiService from '../services/apiService';

const ClassificationManager = () => {
    const [classifications, setClassifications] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Equipment' // Default type
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchClassifications();
    }, []);

    const fetchClassifications = async () => {
        setLoading(true);
        try {
            const data = await apiService.getClassifications();
            console.log('Fetched classifications:', data);
            setClassifications(data);
            // Clear any previous errors
            setError(null);
        } catch (error) {
            console.error('Error fetching classifications:', error);
            setError('Failed to load classifications. Please try again.');

            // Try fallback API
            try {
                const fallbackData = await apiService.fallback.getClassifications();
                setClassifications(fallbackData);
                setError(null); // Clear error if fallback succeeds
            } catch (fallbackError) {
                console.error('Fallback API also failed:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiService.createClassification(formData);
            setFormData({ name: '', type: 'Equipment' });
            await fetchClassifications();
            setSuccess('Classification created successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error creating classification:', error);
            setError('Failed to create classification. Please try again.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            await apiService.deleteClassification(id);
            await fetchClassifications();
            setSuccess('Classification deleted successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error deleting classification:', error);
            setError('Failed to delete classification. It may be referenced by metering data or EnPIs.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const createDefaultClassifications = async () => {
        setLoading(true);
        try {
            // Default classifications
            const defaults = [
                { name: "Main Building", type: "Facility" },
                { name: "Server Room", type: "Equipment" },
                { name: "Production Line A", type: "ProductionLine" },
                { name: "Office Space", type: "Facility" },
                { name: "Data Center", type: "Facility" },
                { name: "HVAC System", type: "Equipment" }
            ];

            // Create each default classification
            for (const classification of defaults) {
                await apiService.createClassification(classification);
            }

            // Refresh the list
            await fetchClassifications();
            setSuccess('Default classifications created successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error creating default classifications:', error);
            setError('Failed to create default classifications. Please try again.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Classification Manager</h2>

            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                    {success}
                </Alert>
            )}

            <Row className="mb-4">
                <Col>
                    <Button
                        variant="primary"
                        onClick={createDefaultClassifications}
                        disabled={loading}
                        className="me-2"
                    >
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-1"
                                />
                                Loading...
                            </>
                        ) : 'Create Default Classifications'}
                    </Button>
                    <Button
                        variant="outline-secondary"
                        onClick={fetchClassifications}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Col>
            </Row>

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Add New Classification</Card.Title>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter classification name"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="Equipment">Equipment</option>
                                <option value="Facility">Facility</option>
                                <option value="ProductionLine">Production Line</option>
                                <option value="Organization">Organization</option>
                            </Form.Select>
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-1"
                                    />
                                    Saving...
                                </>
                            ) : 'Add Classification'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <h3>Classifications</h3>
            {loading && classifications.length === 0 ? (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Loading classifications...</p>
                </div>
            ) : classifications.length === 0 ? (
                <Alert variant="info">
                    No classifications found. Create some using the form above or click "Create Default Classifications".
                </Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(classifications) && classifications.map(classification => (
                            <tr key={classification.id}>
                                <td>{classification.id}</td>
                                <td>{classification.name}</td>
                                <td>{classification.type}</td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(classification.id)}
                                        disabled={loading}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default ClassificationManager;