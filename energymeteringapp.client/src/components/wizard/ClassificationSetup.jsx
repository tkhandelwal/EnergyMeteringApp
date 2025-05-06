// New file: energymeteringapp.client/src/components/wizard/ClassificationSetup.jsx
import React, { useState } from 'react';
import { Form, Button, Table, Row, Col, Alert } from 'react-bootstrap';

const ClassificationSetup = ({ onData, data }) => {
    const [classifications, setClassifications] = useState(data || []);
    const [newClassification, setNewClassification] = useState({
        name: '',
        type: 'Equipment',
        energyType: 'Electricity',
        measurementUnit: 'kWh'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewClassification({
            ...newClassification,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newClassification.name || !newClassification.type) {
            return;
        }

        const updatedClassifications = [...classifications, { ...newClassification, id: Date.now() }];
        setClassifications(updatedClassifications);
        onData(updatedClassifications);

        // Reset form
        setNewClassification({
            name: '',
            type: 'Equipment',
            energyType: 'Electricity',
            measurementUnit: 'kWh'
        });
    };

    const handleDelete = (id) => {
        const updatedClassifications = classifications.filter(c => c.id !== id);
        setClassifications(updatedClassifications);
        onData(updatedClassifications);
    };

    const classificationTypes = [
        { value: 'Equipment', label: 'Equipment' },
        { value: 'Facility', label: 'Facility' },
        { value: 'ProductionLine', label: 'Production Line' },
        { value: 'Organization', label: 'Organization' }
    ];

    const energyTypes = [
        { value: 'Electricity', label: 'Electricity' },
        { value: 'Gas', label: 'Natural Gas' },
        { value: 'Water', label: 'Water' },
        { value: 'Steam', label: 'Steam' },
        { value: 'Compressed Air', label: 'Compressed Air' }
    ];

    const measurementUnits = {
        'Electricity': [
            { value: 'kWh', label: 'kilowatt-hour (kWh)' },
            { value: 'MWh', label: 'megawatt-hour (MWh)' }
        ],
        'Gas': [
            { value: 'm³', label: 'cubic meter (m³)' },
            { value: 'BTU', label: 'British Thermal Unit (BTU)' }
        ],
        'Water': [
            { value: 'm³', label: 'cubic meter (m³)' },
            { value: 'gal', label: 'gallon (gal)' }
        ],
        'Steam': [
            { value: 'kg', label: 'kilogram (kg)' },
            { value: 'lb', label: 'pound (lb)' }
        ],
        'Compressed Air': [
            { value: 'm³', label: 'cubic meter (m³)' },
            { value: 'cf', label: 'cubic feet (cf)' }
        ]
    };

    return (
        <div>
            <h4>Step 1: Define Classifications</h4>
            <p>
                Create classifications for energy metering points within your organization.
                Examples include facilities, equipment, production lines, etc.
            </p>

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={newClassification.name}
                                onChange={handleChange}
                                placeholder="e.g., Server Room, Production Line A"
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                name="type"
                                value={newClassification.type}
                                onChange={handleChange}
                                required
                            >
                                {classificationTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Energy Type</Form.Label>
                            <Form.Select
                                name="energyType"
                                value={newClassification.energyType}
                                onChange={handleChange}
                                required
                            >
                                {energyTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Measurement Unit</Form.Label>
                            <Form.Select
                                name="measurementUnit"
                                value={newClassification.measurementUnit}
                                onChange={handleChange}
                                required
                            >
                                {measurementUnits[newClassification.energyType]?.map(unit => (
                                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Button variant="primary" type="submit">Add Classification</Button>
            </Form>

            {classifications.length > 0 ? (
                <Table className="mt-4" bordered striped>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Energy Type</th>
                            <th>Measurement Unit</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classifications.map(classification => (
                            <tr key={classification.id}>
                                <td>{classification.name}</td>
                                <td>{classification.type}</td>
                                <td>{classification.energyType}</td>
                                <td>{classification.measurementUnit}</td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(classification.id)}
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
                    No classifications defined yet. Add at least one classification to continue.
                </Alert>
            )}

            <div className="mt-3 mb-3">
                <Alert variant="info">
                    <Alert.Heading>ISO 50001 Guidelines</Alert.Heading>
                    <p>
                        ISO 50001 requires organizations to identify areas of significant energy use.
                        Properly classifying energy consumption areas helps in monitoring, analyzing,
                        and improving energy performance.
                    </p>
                </Alert>
            </div>
        </div>
    );
};

export default ClassificationSetup;