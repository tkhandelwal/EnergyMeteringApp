// src/components/wizard/ClassificationSetup.jsx
import React, { useState } from 'react';
import { Form, Button, Table, Row, Col, Alert } from 'react-bootstrap';

const ClassificationSetup = ({ onData, data }) => {
    const [classifications, setClassifications] = useState(data || []);
    const [newClassification, setNewClassification] = useState({
        name: '',
        type: 'Facility',
        energyType: 'Electricity', // New field
        measurementUnit: 'kWh'     // New field
    });

    const energyTypes = [
        { value: 'Electricity', label: 'Electricity', defaultUnit: 'kWh' },
        { value: 'Gas', label: 'Natural Gas', defaultUnit: 'm³' },
        { value: 'Water', label: 'Water', defaultUnit: 'm³' },
        { value: 'Steam', label: 'Steam', defaultUnit: 'kg' },
        { value: 'HVAC', label: 'HVAC', defaultUnit: 'BTU' },
        { value: 'Other', label: 'Other', defaultUnit: '' }
    ];

    const unitsByEnergyType = {
        'Electricity': ['kWh', 'MWh', 'kW', 'MW'],
        'Gas': ['m³', 'ft³', 'therms'],
        'Water': ['m³', 'gallons', 'liters'],
        'Steam': ['kg', 'lb', 'ton'],
        'HVAC': ['BTU', 'kWh', 'ton of refrigeration'],
        'Other': ['kWh', 'm³', 'kg', 'custom']
    };

    const classificationTypes = [
        'Facility',
        'Equipment',
        'Production Line',
        'Department',
        'Process',
        'Building',
        'Area'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'energyType') {
            // When energy type changes, update the default unit
            const selectedEnergyType = energyTypes.find(type => type.value === value);
            setNewClassification({
                ...newClassification,
                [name]: value,
                measurementUnit: selectedEnergyType?.defaultUnit || ''
            });
        } else {
            setNewClassification({
                ...newClassification,
                [name]: value
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newClassification.name.trim()) return;

        const updatedClassifications = [...classifications, { ...newClassification, id: Date.now() }];
        setClassifications(updatedClassifications);
        onData(updatedClassifications);

        // Reset form
        setNewClassification({
            name: '',
            type: 'Facility',
            energyType: 'Electricity',
            measurementUnit: 'kWh'
        });
    };

    const handleDelete = (id) => {
        const updatedClassifications = classifications.filter(c => c.id !== id);
        setClassifications(updatedClassifications);
        onData(updatedClassifications);
    };

    return (
        <div>
            <h4>Step 1: Define Energy Classifications</h4>
            <p>
                Start by defining the classifications for your energy systems.
                These represent the different areas, equipment, or processes that consume energy.
                For ISO 50001 compliance, specify the energy type and measurement unit for each classification.
            </p>

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Classification Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={newClassification.name}
                                onChange={handleChange}
                                placeholder="e.g., Main Building, Server Room"
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                name="type"
                                value={newClassification.type}
                                onChange={handleChange}
                                required
                            >
                                {classificationTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
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
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Measurement Unit</Form.Label>
                            <Form.Select
                                name="measurementUnit"
                                value={newClassification.measurementUnit}
                                onChange={handleChange}
                                required
                            >
                                {unitsByEnergyType[newClassification.energyType]?.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
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
                    No classifications added yet. Add at least one classification to continue.
                </Alert>
            )}

            <div className="mt-3 mb-3">
                <Alert variant="info">
                    <Alert.Heading>ISO 50001 Guidelines</Alert.Heading>
                    <p>
                        ISO 50001 requires organizations to identify areas of significant energy use.
                        Each classification should represent an energy consumer that you want to monitor and improve.
                    </p>
                </Alert>
            </div>
        </div>
    );
};

export default ClassificationSetup;