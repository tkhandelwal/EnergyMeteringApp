// New file: energymeteringapp.client/src/components/wizard/EnPISetup.jsx
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewEnpi({
            ...newEnpi,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newEnpi.name || !newEnpi.classificationId || !newEnpi.formulaType) {
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

    const formulaTypes = [
        { value: 'TotalEnergy', label: 'Total Energy' },
        { value: 'EnergyPerHour', label: 'Energy per Hour' },
        { value: 'MaxPower', label: 'Maximum Power' },
        { value: 'AvgPower', label: 'Average Power' }
    ];

    const normalizationTypes = [
        { value: 'None', label: 'None' },
        { value: 'ProductionOutput', label: 'Production Output' },
        { value: 'HoursOfOperation', label: 'Hours of Operation' },
        { value: 'FloorArea', label: 'Floor Area' },
        { value: 'HeatingDegreeDays', label: 'Heating Degree Days' },
        { value: 'CoolingDegreeDays', label: 'Cooling Degree Days' },
        { value: 'Occupancy', label: 'Occupancy' }
    ];

    const getClassificationName = (id) => {
        const classification = classifications.find(c => c.id === id);
        return classification ? classification.name : 'Unknown';
    };

    return (
        <div>
            <h4>Step 3: Define Energy Performance Indicators (EnPIs)</h4>
            <p>
                Energy Performance Indicators help measure and monitor energy performance.
                They can be absolute values or normalized by relevant variables.
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
                                placeholder="e.g., Server Room Energy Intensity"
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
                                        {classification.name} ({classification.type})
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
                                {normalizationTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
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
                                placeholder="e.g., kWh/ton, kWh/m²"
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
                        placeholder="Description of what this EnPI measures and why it's important"
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
                                <td>{getClassificationName(enpi.classificationId)}</td>
                                <td>{formulaTypes.find(t => t.value === enpi.formulaType)?.label}</td>
                                <td>
                                    {enpi.normalizeBy !== 'None' ?
                                        `${normalizationTypes.find(t => t.value === enpi.normalizeBy)?.label} (${enpi.normalizationUnit})` :
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
                    No EnPIs defined yet. Add at least one EnPI to continue.
                </Alert>
            )}

            <div className="mt-3 mb-3">
                <Alert variant="info">
                    <Alert.Heading>ISO 50001 Guidelines</Alert.Heading>
                    <p>
                        ISO 50001 requires organizations to establish energy performance indicators (EnPIs)
                        appropriate for monitoring and measuring energy performance. EnPIs should be reviewed
                        and compared to the energy baseline as appropriate.
                    </p>
                </Alert>
            </div>
        </div>
    );
};

export default EnPISetup;