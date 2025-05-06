// src/components/wizard/BaselineSetup.jsx
import React, { useState } from 'react';
import { Form, Button, Table, Row, Col, Alert } from 'react-bootstrap';

const BaselineSetup = ({ onData, data, classifications }) => {
    const [baselines, setBaselines] = useState(data || []);
    const [newBaseline, setNewBaseline] = useState({
        classificationId: classifications.length > 0 ? classifications[0].id : '',
        startDate: '',
        endDate: '',
        description: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewBaseline({
            ...newBaseline,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newBaseline.classificationId || !newBaseline.startDate || !newBaseline.endDate) {
            return;
        }

        const updatedBaselines = [...baselines, { ...newBaseline, id: Date.now() }];
        setBaselines(updatedBaselines);
        onData(updatedBaselines);

        // Reset form
        setNewBaseline({
            classificationId: classifications.length > 0 ? classifications[0].id : '',
            startDate: '',
            endDate: '',
            description: ''
        });
    };

    const handleDelete = (id) => {
        const updatedBaselines = baselines.filter(b => b.id !== id);
        setBaselines(updatedBaselines);
        onData(updatedBaselines);
    };

    const getClassificationName = (id) => {
        const classification = classifications.find(c => c.id === id);
        return classification ? classification.name : 'Unknown';
    };

    return (
        <div>
            <h4>Step 2: Define Energy Baselines</h4>
            <p>
                Establish baseline periods for each classification.
                This will serve as the reference point for measuring energy performance improvements.
            </p>

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Classification</Form.Label>
                            <Form.Select
                                name="classificationId"
                                value={newBaseline.classificationId}
                                onChange={handleChange}
                                required
                            >
                                {classifications.map(classification => (
                                    <option key={classification.id} value={classification.id}>
                                        {classification.name} ({classification.energyType})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={newBaseline.startDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={newBaseline.endDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                name="description"
                                value={newBaseline.description}
                                onChange={handleChange}
                                placeholder="e.g., Pre-optimization baseline"
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Button variant="primary" type="submit">Add Baseline Period</Button>
            </Form>

            {baselines.length > 0 ? (
                <Table className="mt-4" bordered striped>
                    <thead>
                        <tr>
                            <th>Classification</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {baselines.map(baseline => (
                            <tr key={baseline.id}>
                                <td>{getClassificationName(baseline.classificationId)}</td>
                                <td>{baseline.startDate}</td>
                                <td>{baseline.endDate}</td>
                                <td>{baseline.description}</td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(baseline.id)}
                                    >
                                        Remove
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <Alert variant="info" className="mt-3">
                    No baseline periods defined yet. Add at least one baseline to continue.
                </Alert>
            )}

            <div className="mt-3 mb-3">
                <Alert variant="info">
                    <Alert.Heading>ISO 50001 Guidelines</Alert.Heading>
                    <p>
                        ISO 50001 requires establishing an energy baseline using energy consumption information.
                        The baseline should represent a reasonable time period (e.g., 12 months) and consider
                        variables that affect energy consumption.
                    </p>
                </Alert>
            </div>
        </div>
    );
};

export default BaselineSetup;