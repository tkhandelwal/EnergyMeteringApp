// src/components/wizard/TargetSetup.jsx
import React, { useState } from 'react';
import { Form, Button, Table, Row, Col, Alert } from 'react-bootstrap';

const TargetSetup = ({ onData, data, enpiDefinitions }) => {
    const [targets, setTargets] = useState(data || []);
    const [newTarget, setNewTarget] = useState({
        enpiId: enpiDefinitions.length > 0 ? enpiDefinitions[0].id : '',
        targetValue: '',
        targetType: 'Reduction',
        targetDate: '',
        description: ''
    });

    const targetTypes = [
        { value: 'Reduction', label: 'Reduction (%)' },
        { value: 'AbsoluteValue', label: 'Absolute Value' },
        { value: 'MaximumValue', label: 'Maximum Value' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewTarget({
            ...newTarget,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newTarget.enpiId || !newTarget.targetValue || !newTarget.targetDate) {
            return;
        }

        const updatedTargets = [...targets, { ...newTarget, id: Date.now() }];
        setTargets(updatedTargets);
        onData(updatedTargets);

        // Reset form
        setNewTarget({
            enpiId: enpiDefinitions.length > 0 ? enpiDefinitions[0].id : '',
            targetValue: '',
            targetType: 'Reduction',
            targetDate: '',
            description: ''
        });
    };

    const handleDelete = (id) => {
        const updatedTargets = targets.filter(t => t.id !== id);
        setTargets(updatedTargets);
        onData(updatedTargets);
    };

    const getEnpiName = (id) => {
        const enpi = enpiDefinitions.find(e => e.id === id);
        return enpi ? enpi.name : 'Unknown';
    };

    return (
        <div>
            <h4>Step 4: Set Energy Performance Targets</h4>
            <p>
                Define specific, measurable targets for each EnPI.
                These targets will help drive energy performance improvement and meet ISO 50001 requirements.
            </p>

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>EnPI</Form.Label>
                            <Form.Select
                                name="enpiId"
                                value={newTarget.enpiId}
                                onChange={handleChange}
                                required
                            >
                                {enpiDefinitions.map(enpi => (
                                    <option key={enpi.id} value={enpi.id}>
                                        {enpi.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Target Type</Form.Label>
                            <Form.Select
                                name="targetType"
                                value={newTarget.targetType}
                                onChange={handleChange}
                                required
                            >
                                {targetTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Target Value</Form.Label>
                            <Form.Control
                                type="number"
                                name="targetValue"
                                value={newTarget.targetValue}
                                onChange={handleChange}
                                step="0.01"
                                placeholder={newTarget.targetType === 'Reduction' ? "e.g., 10 (for 10%)" : "e.g., 500"}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Target Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="targetDate"
                                value={newTarget.targetDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        type="text"
                        name="description"
                        value={newTarget.description}
                        onChange={handleChange}
                        placeholder="e.g., Annual energy reduction goal"
                    />
                </Form.Group>

                <Button variant="primary" type="submit">Add Target</Button>
            </Form>

            {targets.length > 0 ? (
                <Table className="mt-4" bordered striped>
                    <thead>
                        <tr>
                            <th>EnPI</th>
                            <th>Target Type</th>
                            <th>Target Value</th>
                            <th>Target Date</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {targets.map(target => (
                            <tr key={target.id}>
                                <td>{getEnpiName(target.enpiId)}</td>
                                <td>{targetTypes.find(t => t.value === target.targetType)?.label}</td>
                                <td>
                                    {target.targetValue}
                                    {target.targetType === 'Reduction' ? '%' : ''}
                                </td>
                                <td>{target.targetDate}</td>
                                <td>{target.description}</td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(target.id)}
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
                    No targets defined yet. Add at least one target to complete the setup.
                </Alert>
            )}

            <div className="mt-3 mb-3">
                <Alert variant="info">
                    <Alert.Heading>ISO 50001 Guidelines</Alert.Heading>
                    <p>
                        ISO 50001 requires organizations to establish energy objectives and targets.
                        Targets should be consistent with the energy policy, measurable, and have defined timeframes.
                        Consider setting both short-term and long-term targets to demonstrate continuous improvement.
                    </p>
                </Alert>
            </div>
        </div>
    );
};

export default TargetSetup;