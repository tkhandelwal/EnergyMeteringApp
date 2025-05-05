// src/components/ParetoAnalysis.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Card, Row, Col, Table } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import moment from 'moment';

const ParetoAnalysis = () => {
    const [meteringData, setMeteringData] = useState([]);
    const [_classifications, setClassifications] = useState([]);
    const [formConfig, setFormConfig] = useState({
        startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        groupBy: 'classification', // classification, dayOfWeek, hourOfDay
        metricType: 'energy' // energy, power
    });

    useEffect(() => {
        fetchClassifications();
        fetchMeteringData();
    }, []);

    const fetchClassifications = async () => {
        try {
            const response = await axios.get('/api/classifications');
            setClassifications(response.data);
        } catch (error) {
            console.error('Error fetching classifications:', error);
        }
    };

    const fetchMeteringData = async () => {
        try {
            const response = await axios.get('/api/meteringdata');
            setMeteringData(response.data);
        } catch (error) {
            console.error('Error fetching metering data:', error);
        }
    };

    const handleConfigChange = (e) => {
        setFormConfig({
            ...formConfig,
            [e.target.name]: e.target.value
        });
    };

    const getFilteredData = () => {
        return meteringData.filter(data =>
            moment(data.timestamp).isBetween(
                moment(formConfig.startDate),
                moment(formConfig.endDate),
                undefined,
                '[]'
            )
        );
    };

    const prepareParetoData = () => {
        const filteredData = getFilteredData();

        if (filteredData.length === 0) {
            return {
                labels: [],
                values: [],
                cumulativePercent: []
            };
        }

        // Group data based on selected grouping
        const groupedData = {};

        filteredData.forEach(data => {
            let key;

            switch (formConfig.groupBy) {
                case 'classification':
                    key = data.classification?.name || 'Unknown';
                    break;
                case 'dayOfWeek':
                    key = moment(data.timestamp).format('dddd');
                    break;
                case 'hourOfDay':
                    key = moment(data.timestamp).format('HH:00');
                    break;
                default:
                    key = 'Unknown';
            }

            if (!groupedData[key]) {
                groupedData[key] = 0;
            }

            // Add value based on selected metric
            if (formConfig.metricType === 'energy') {
                groupedData[key] += data.energyValue;
            } else {
                // For power, we're taking max power for each group
                groupedData[key] = Math.max(groupedData[key], data.power);
            }
        });

        // Convert to arrays and sort by value (descending)
        const sortedData = Object.entries(groupedData)
            .sort((a, b) => b[1] - a[1]);

        const labels = sortedData.map(item => item[0]);
        const values = sortedData.map(item => item[1]);

        // Calculate cumulative percentages
        const total = values.reduce((sum, value) => sum + value, 0);
        let cumulativeSum = 0;
        const cumulativePercent = values.map(value => {
            cumulativeSum += value;
            return (cumulativeSum / total) * 100;
        });

        return {
            labels,
            values,
            cumulativePercent
        };
    };

    const getParetoChartData = () => {
        const data = prepareParetoData();

        return [
            {
                x: data.labels,
                y: data.values,
                type: 'bar',
                name: formConfig.metricType === 'energy' ? 'Energy (kWh)' : 'Power (kW)',
                marker: {
                    color: 'rgba(55, 128, 191, 0.7)',
                    line: {
                        color: 'rgba(55, 128, 191, 1.0)',
                        width: 2
                    }
                }
            },
            {
                x: data.labels,
                y: data.cumulativePercent,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Cumulative %',
                yaxis: 'y2',
                line: { color: 'red' },
                marker: {
                    color: 'red',
                    size: 8
                }
            }
        ];
    };

    const renderParetoTable = () => {
        const data = prepareParetoData();

        if (data.labels.length === 0) {
            return <p>No data available for the selected criteria.</p>;
        }

        return (
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{formConfig.groupBy === 'classification' ? 'Classification' :
                            formConfig.groupBy === 'dayOfWeek' ? 'Day of Week' : 'Hour of Day'}</th>
                        <th>{formConfig.metricType === 'energy' ? 'Energy (kWh)' : 'Power (kW)'}</th>
                        <th>% of Total</th>
                        <th>Cumulative %</th>
                    </tr>
                </thead>
                <tbody>
                    {data.labels.map((label, index) => {
                        const percentOfTotal = (data.values[index] / data.values.reduce((a, b) => a + b, 0)) * 100;

                        return (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{label}</td>
                                <td>{data.values[index].toFixed(2)}</td>
                                <td>{percentOfTotal.toFixed(2)}%</td>
                                <td>{data.cumulativePercent[index].toFixed(2)}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        );
    };

    return (
        <div>
            <h2>Pareto Analysis</h2>

            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={formConfig.startDate}
                                    onChange={handleConfigChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={formConfig.endDate}
                                    onChange={handleConfigChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Group By</Form.Label>
                                <Form.Select
                                    name="groupBy"
                                    value={formConfig.groupBy}
                                    onChange={handleConfigChange}
                                >
                                    <option value="classification">Classification</option>
                                    <option value="dayOfWeek">Day of Week</option>
                                    <option value="hourOfDay">Hour of Day</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Metric</Form.Label>
                                <Form.Select
                                    name="metricType"
                                    value={formConfig.metricType}
                                    onChange={handleConfigChange}
                                >
                                    <option value="energy">Energy (kWh)</option>
                                    <option value="power">Power (kW)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Body>
                    <h4>Pareto Chart</h4>
                    <Plot
                        data={getParetoChartData()}
                        layout={{
                            height: 500,
                            margin: { l: 60, r: 60, b: 120, t: 40, pad: 4 },
                            xaxis: {
                                title: formConfig.groupBy === 'classification' ? 'Classification' :
                                    formConfig.groupBy === 'dayOfWeek' ? 'Day of Week' : 'Hour of Day',
                                tickangle: -45
                            },
                            yaxis: {
                                title: formConfig.metricType === 'energy' ? 'Energy (kWh)' : 'Power (kW)'
                            },
                            yaxis2: {
                                title: 'Cumulative Percentage',
                                titlefont: { color: 'red' },
                                tickfont: { color: 'red' },
                                overlaying: 'y',
                                side: 'right',
                                range: [0, 100],
                                ticksuffix: '%'
                            },
                            legend: {
                                orientation: 'h',
                                y: -0.2
                            },
                            annotations: [
                                {
                                    x: 0.5,
                                    y: -0.3,
                                    xref: 'paper',
                                    yref: 'paper',
                                    text: `This chart shows that a small number of ${formConfig.groupBy === 'classification' ? 'classifications' :
                                        formConfig.groupBy === 'dayOfWeek' ? 'days' : 'hours'} account for the majority of ${formConfig.metricType === 'energy' ? 'energy consumption' : 'power demand'}`,
                                    showarrow: false,
                                    font: {
                                        size: 12
                                    }
                                }
                            ]
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%' }}
                    />
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <h4>Pareto Analysis Table</h4>
                    {renderParetoTable()}
                </Card.Body>
            </Card>
        </div>
    );
};

export default ParetoAnalysis;