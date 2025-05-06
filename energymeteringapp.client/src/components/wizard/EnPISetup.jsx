// src/components/wizard/EnPISetup.jsx
import React, { useState } from 'react';
import { Form, Button, Table, Row, Col, Alert } from 'react-bootstrap';

const EnPISetup = ({ onData, data, classifications }) => {
    const [enpiDefinitions, setEnpiDefinitions] = useState(data || []);
    const [newEnpi, setNewEnpi] = useState({
        name: '',
        classificationId: classifications.length > 0 ? classifications[0].id : '',
        formulaType: 'TotalEnergy',
        normalizeBy: 'None',
        normalizationUnit: '',
        description: ''
    });

    const formulaTypes = [
        { value: 'TotalEnergy', label: 'Total Energy Consumption' },
        { value: 'EnergyPerHour', label: 'Energy per Hour' },
        { value: 'MaxPower', label: 'Maximum Power Demand' },
        { value: 'AvgPower', label: 'Average Power Demand' },
        { value: 'EnergyPerUnit', label: 'Energy per Production Unit' },
        { value: 'EnergyPerArea', label: 'Energy per Area' }
    ];

    const normalizationOptions = [
        { value: 'None', label: 'None' },
        { value: 'ProductionVolume', label: 'Production Volume' },
        { value: 'OccupiedHours', label: 'Occupied Hours' },
        { value: 'DegreeDay', label: 'Degree Days' },
        { value: 'Area', label: 'Floor Area' },
        { value: 'Custom', label: 'Custom' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewEnpi({
            ...newEnpi,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newEnpi.name || !newEnpi.classificationId) {
            return;
        }

        const updatedEnpis = [...enpiDefinitions, { ...newEnpi, id: Date.now() }];
        setEnpiDefinitions(updatedEnpis);
        onData(updatedEnpis);

        // Reset form
        setNewEnpi({
            name: '',
            classificationId: classifications.length > 0 ? classifications[0].id : '',
            formulaType: 'TotalEnergy',
            normalizeBy: 'None',
            normalizationUnit: '',
            description: ''
        });
    };

    const handleDelete = (id) => {
        const updatedEnpis = enpiDefinitions.filter(e => e.id !== id);
        setEnpiDefinitions(updatedEnpis);
        onData(updatedEnpis);
    };

    const getClassificationDetails = (id) => {
        const classification = classifications.find(c => c.id === id);
        return classification ?
            `${classification.name} (${classification.energyType} - ${classification.measurementUnit})` :
            'Unknown';
    };

    return (
        <div>
            <h4>Step 3: Define Energy Performance Indicators (EnPIs)</h4>
            <p>
                Create Energy Performance Indicators to measure and track energy efficiency improvements.
                EnPIs should be relevant to your organization's energy use and aligned with ISO 50001 requirements.
            </p>

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>EnPI Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={newEnpi.name}
                                onChange={handleChange}
                                placeholder="e.g., Building Energy Intensity"
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Classification</Form.Label>
                            <Form.Select
                                name="classificationId"
                                value={newEnpi.classificationId}
                                onChange={handleChange}
                                required
                            >
                                {classifications.map(classification => (
                                    <option key={classification.id} value={classification.id}>
                                        {classification.name} ({classification.energyType} - {classification.measurementUnit})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Formula Type</Form.Label>
                            <Form.Select
                                name="formulaType"
                                value={newEnpi.formulaType}
                                onChange={handleChange}
                                required
                            >
                                {formulaTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Normalize By</Form.Label>
                            <Form.Select
                                name="normalizeBy"
                                value={newEnpi.normalizeBy}
                                onChange={handleChange}
                            >
                                {normalizationOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Normalization Unit</Form.Label>
                            <Form.Control
                                type="text"
                                name="normalizationUnit"
                                value={newEnpi.normalizationUnit}
                                onChange={handleChange}
                                placeholder="e.g., units, m², hours"
                                disabled={newEnpi.normalizeBy === 'None'}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        name="description"
                        value={newEnpi.description}
                        onChange={handleChange}
                        placeholder="Describe how this EnPI will be used to measure energy performance"
                    />
                </Form.Group>

                <Button variant="primary" type="submit">Add EnPI</Button>
            </Form>

            {enpiDefinitions.length > 0 ? (
                <Table className="mt-4" bordered striped>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Classification</th>
                            <th>Formula Type</th>
                            <th>Normalization</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enpiDefinitions.map(enpi => (
                            <tr key={enpi.id}>
                                <td>{enpi.name}</td>
                                <td>{getClassificationDetails(enpi.classificationId)}</td>
                                <td>{formulaTypes.find(f => f.value === enpi.formulaType)?.label}</td>
                                <td>
                                    {enpi.normalizeBy !== 'None' ?
                                        `${normalizationOptions.find(n => n.value === enpi.normalizeBy)?.label} (${enpi.normalizationUnit})` :
                                        'None'}
                                </td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(enpi.id)}
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
                    No EnPI definitions added yet. Add at least one EnPI to continue.
                </Alert>
            )}

            <div className="mt-3 mb-3">
                <Alert variant="info">
                    <Alert.Heading>ISO 50001 Guidelines</Alert.Heading>
                    <p>
                        ISO 50001 requires organizations to identify appropriate EnPIs to monitor energy performance.
                        EnPIs should be regularly reviewed and compared to the energy baseline to track improvements.
                        Consider both simple metrics (total consumption) and normalized metrics (energy per unit of production).
                    </p>
                </Alert>
            </div>
        </div>
    );
};

export default EnPISetup;