// src/components/ClassificationManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Table, Card } from 'react-bootstrap';

const ClassificationManager = () => {
    const [classifications, setClassifications] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Equipment' // Default type
    });

    useEffect(() => {
        fetchClassifications();
    }, []);

    const fetchClassifications = async () => {
        try {
            const response = await axios.get('/api/classifications');
            console.log('Fetched classifications:', response.data);
            // If response.data is { classifications: [...] }, use this instead:
            // setClassifications(response.data.classifications);
            setClassifications(response.data);
        } catch (error) {
            console.error('Error fetching classifications:', error);
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
        try {
            await axios.post('/api/classifications', formData);
            setFormData({ name: '', type: 'Equipment' });
            fetchClassifications();
        } catch (error) {
            console.error('Error creating classification:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/classifications/${id}`);
            fetchClassifications();
        } catch (error) {
            console.error('Error deleting classification:', error);
        }
    };

    return (
        <div>
            <h2>Classification Manager</h2>
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
                        <Button variant="primary" type="submit">
                            Add Classification
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <h3>Classifications</h3>
            <Table striped bordered hover>
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
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default ClassificationManager;
