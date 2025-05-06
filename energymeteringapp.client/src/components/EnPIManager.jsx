// src/components/EnPIManager.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Table, Alert, Row, Col } from 'react-bootstrap';
import moment from 'moment';
import Plot from 'react-plotly.js';
import apiService from '../services/apiService';

const EnPIManager = () => {
    const [classifications, setClassifications] = useState([]);
    const [enpiList, setEnpiList] = useState([]);
    const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        formula: 'EnergyPerHour',
        classificationId: '',
        startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        baselineStartDate: moment().subtract(60, 'days').format('YYYY-MM-DD'),
        baselineEndDate: moment().subtract(31, 'days').format('YYYY-MM-DD'),
        useBaseline: true
    });

    const fetchClassifications = async () => {
        try {
            setLoading(true);
            const response = await apiService.getClassifications();
            setClassifications(response);
            if (response.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    classificationId: response[0].id
                }));
            }
        } catch (error) {
            console.error('Error fetching classifications:', error);
            showAlert('Failed to load classifications', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const fetchEnPIs = async () => {
        try {
            setLoading(true);
            const response = await apiService.getEnPIs();
            setEnpiList(response);
        } catch (error) {
            console.error('Error fetching EnPIs:', error);
            showAlert('Failed to load EnPIs', 'danger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassifications();
        fetchEnPIs();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                name: formData.name,
                formula: formData.formula,
                classificationId: parseInt(formData.classificationId, 10),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                baselineStartDate: formData.useBaseline ? new Date(formData.baselineStartDate) : null,
                baselineEndDate: formData.useBaseline ? new Date(formData.baselineEndDate) : null
            };

            await apiService.calculateEnPI(payload);
            showAlert('EnPI calculated successfully!', 'success');
            await fetchEnPIs();

            // Reset form
            setFormData(prev => ({
                ...prev,
                name: ''
            }));
        } catch (error) {
            console.error('Error calculating EnPI:', error);
            showAlert(`Failed to calculate EnPI: ${error.message || 'Unknown error'}`, 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await apiService.deleteEnPI(id);
            showAlert('EnPI deleted successfully', 'success');
            await fetchEnPIs();
        } catch (error) {
            console.error('Error deleting EnPI:', error);
            showAlert('Failed to delete EnPI', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, variant) => {
        setAlert({ show: true, message, variant });
        setTimeout(() => {
            setAlert({ show: false, message: '', variant: '' });
        }, 3000);
    };

    const renderEnPIChart = () => {
        if (enpiList.length === 0) return null;

        // Group by formula type
        const enpiByFormula = {};
        enpiList.forEach(enpi => {
            if (!enpiByFormula[enpi.formula]) {
                enpiByFormula[enpi.formula] = [];
            }
            enpiByFormula[enpi.formula].push(enpi);
        });

        // Create a chart for each formula type
        return Object.entries(enpiByFormula).map(([formula, enpis]) => {
            const sortedEnPIs = [...enpis].sort((a, b) => b.currentValue - a.currentValue);

            const data = [{
                x: sortedEnPIs.map(e => e.classification?.name || `EnPI ${e.id}`),
                y: sortedEnPIs.map(e => e.currentValue),
                type: 'bar',
                name: 'Current Value',
                marker: { color: 'rgba(55, 128, 191, 0.7)' }
            }];

            // Add baseline values if available
            if (sortedEnPIs.some(e => e.baselineValue > 0)) {
                data.push({
                    x: sortedEnPIs.map(e => e.classification?.name || `EnPI ${e.id}`),
                    y: sortedEnPIs.map(e => e.baselineValue),
                    type: 'bar',
                    name: 'Baseline Value',
                    marker: { color: 'rgba(219, 64, 82, 0.7)' }
                });
            }

            // Calculate improvement percentage if both values exist
            if (sortedEnPIs.some(e => e.baselineValue > 0)) {
                const improvements = sortedEnPIs.map(e => {
                    if (e.baselineValue === 0) return null;
                    return ((e.baselineValue - e.currentValue) / e.baselineValue) * 100;
                });

                if (improvements.some(i => i !== null)) {
                    data.push({
                        x: sortedEnPIs.map(e => e.classification?.name || `EnPI ${e.id}`),
                        y: improvements,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Improvement %',
                        yaxis: 'y2',
                        marker: { color: 'rgba(50, 171, 96, 1)' }
                    });
                }
            }

            let title;
            switch (formula) {
                case 'TotalEnergy':
                    title = 'Total Energy Consumption (kWh)';
                    break;
                case 'EnergyPerHour':
                    title = 'Energy Intensity (kWh/hour)';
                    break;
                case 'MaxPower':
                    title = 'Maximum Power Demand (kW)';
                    break;
                case 'AvgPower':
                    title = 'Average Power Demand (kW)';
                    break;
                default:
                    title = formula;
            }

            return (
                <Card className="mb-4" key={formula}>
                    <Card.Body>
                        <Card.Title>{title}</Card.Title>
                        <Plot
                            data={data}
                            layout={{
                                height: 400,
                                barmode: 'group',
                                margin: { l: 50, r: 50, b: 100, t: 50, pad: 4 },
                                xaxis: {
                                    title: 'Classification',
                                    tickangle: -45
                                },
                                yaxis: {
                                    title: getYAxisTitle(formula)
                                },
                                yaxis2: data.length > 2 ? {
                                    title: 'Improvement %',
                                    titlefont: { color: 'rgba(50, 171, 96, 1)' },
                                    tickfont: { color: 'rgba(50, 171, 96, 1)' },
                                    overlaying: 'y',
                                    side: 'right'
                                } : null,
                                legend: {
                                    orientation: 'h',
                                    y: -0.2
                                }
                            }}
                            useResizeHandler={true}
                            style={{ width: '100%' }}
                        />
                    </Card.Body>
                </Card>
            );
        });
    };

    const getYAxisTitle = (formula) => {
        switch (formula) {
            case 'TotalEnergy':
                return 'Energy (kWh)';
            case 'EnergyPerHour':
                return 'Energy Intensity (kWh/hour)';
            case 'MaxPower':
            case 'AvgPower':
                return 'Power (kW)';
            default:
                return 'Value';
        }
    };

    return (
        <div>
            <h2>Energy Performance Indicators (EnPI)</h2>

            {alert.show && (
                <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
                    {alert.message}
                </Alert>
            )}

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Calculate New EnPI</Card.Title>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Indicator Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g., Monthly Energy Consumption"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Formula Type</Form.Label>
                                    <Form.Select
                                        name="formula"
                                        value={formData.formula}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="TotalEnergy">Total Energy Consumption</option>
                                        <option value="EnergyPerHour">Energy per Hour (Intensity)</option>
                                        <option value="MaxPower">Maximum Power Demand</option>
                                        <option value="AvgPower">Average Power Demand</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Classification</Form.Label>
                                    <Form.Select
                                        name="classificationId"
                                        value={formData.classificationId}
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
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current Period Start</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current Period End</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                name="useBaseline"
                                label="Include Baseline Period for Comparison"
                                checked={formData.useBaseline}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {formData.useBaseline && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Baseline Period Start</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="baselineStartDate"
                                            value={formData.baselineStartDate}
                                            onChange={handleChange}
                                            required={formData.useBaseline}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Baseline Period End</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="baselineEndDate"
                                            value={formData.baselineEndDate}
                                            onChange={handleChange}
                                            required={formData.useBaseline}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Calculating...' : 'Calculate EnPI'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {renderEnPIChart()}

            <Card>
                <Card.Body>
                    <Card.Title>EnPI Records</Card.Title>
                    {enpiList.length === 0 ? (
                        <Alert variant="info">
                            No EnPI records found. Use the form above to calculate your first EnPI.
                        </Alert>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Classification</th>
                                    <th>Formula</th>
                                    <th>Current Value</th>
                                    <th>Baseline Value</th>
                                    <th>Improvement</th>
                                    <th>Calculation Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enpiList.map(enpi => (
                                    <tr key={enpi.id}>
                                        <td>{enpi.name}</td>
                                        <td>{enpi.classification?.name || 'Unknown'}</td>
                                        <td>{enpi.formula}</td>
                                        <td>{enpi.currentValue.toFixed(2)}</td>
                                        <td>{enpi.baselineValue.toFixed(2)}</td>
                                        <td>
                                            {enpi.baselineValue > 0 ?
                                                `${((enpi.baselineValue - enpi.currentValue) / enpi.baselineValue * 100).toFixed(2)}%` :
                                                'N/A'}
                                        </td>
                                        <td>{moment(enpi.calculationDate).format('YYYY-MM-DD HH:mm')}</td>
                                        <td>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(enpi.id)}
                                                disabled={loading}
                                            >
                                                {loading ? '...' : 'Delete'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default EnPIManager;