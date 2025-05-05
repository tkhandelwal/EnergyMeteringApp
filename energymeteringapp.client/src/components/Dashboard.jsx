// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Form } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import moment from 'moment';

const Dashboard = () => {
    const [meteringData, setMeteringData] = useState([]);
    const [classifications, setClassifications] = useState([]);
    const [selectedClassification, setSelectedClassification] = useState('all');
    const [timeRange, setTimeRange] = useState('day');

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

    const handleClassificationChange = (e) => {
        setSelectedClassification(e.target.value);
    };

    const handleTimeRangeChange = (e) => {
        setTimeRange(e.target.value);
    };

    const getFilteredData = () => {
        let filtered = [...meteringData];

        // Filter by classification
        if (selectedClassification !== 'all') {
            filtered = filtered.filter(data =>
                data.classificationId === parseInt(selectedClassification));
        }

        // Filter by time range
        let startTime;

        switch (timeRange) {
            case 'day':
                startTime = moment().subtract(1, 'days');
                break;
            case 'week':
                startTime = moment().subtract(7, 'days');
                break;
            case 'month':
                startTime = moment().subtract(30, 'days');
                break;
            default:
                startTime = moment().subtract(1, 'days');
        }

        filtered = filtered.filter(data =>
            moment(data.timestamp).isAfter(startTime));

        return filtered;
    };

    const filteredData = getFilteredData();

    // Prepare data for energy consumption over time
    const energyConsumptionData = {
        x: filteredData.map(data => new Date(data.timestamp)),
        y: filteredData.map(data => data.energyValue),
        type: 'scatter',
        mode: 'lines',
        name: 'Energy Consumption (kWh)'
    };

    // Prepare data for power over time
    const powerData = {
        x: filteredData.map(data => new Date(data.timestamp)),
        y: filteredData.map(data => data.power),
        type: 'scatter',
        mode: 'lines',
        name: 'Power (kW)',
        line: { color: 'orange' }
    };

    // Group data by classification for pie chart
    const getEnergyByClassification = () => {
        const energyByClass = {};

        if (Array.isArray(meteringData)) {
            meteringData.forEach(data => {
                const classificationName = data.classification?.name || 'Unknown';
                if (!energyByClass[classificationName]) {
                    energyByClass[classificationName] = 0;
                }
                energyByClass[classificationName] += data.energyValue;
            });
        }

        return {
            labels: Object.keys(energyByClass),
            values: Object.values(energyByClass),
            type: 'pie',
            hole: 0.4,
            textinfo: 'label+percent',
            insidetextorientation: 'radial'
        };
    };

    // Hourly average usage for pattern detection
    const getHourlyAverages = () => {
        const hourlyData = Array(24).fill(0);
        const hourlyCount = Array(24).fill(0);

        filteredData.forEach(data => {
            const hour = new Date(data.timestamp).getHours();
            hourlyData[hour] += data.power;
            hourlyCount[hour]++;
        });

        // Calculate averages
        const hourlyAvg = hourlyData.map((total, i) =>
            hourlyCount[i] > 0 ? total / hourlyCount[i] : 0);

        return {
            x: Array.from({ length: 24 }, (_, i) => i),
            y: hourlyAvg,
            type: 'bar',
            name: 'Avg. Power by Hour (kW)'
        };
    };

    return (
        <div>
            <h2>Energy Dashboard</h2>
            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Classification</Form.Label>
                        <Form.Select value={selectedClassification} onChange={handleClassificationChange}>
                            <option value="all">All Classifications</option>
                            {Array.isArray(classifications) && classifications.map(classification => (
                                <option key={classification.id} value={classification.id}>
                                    {classification.name} ({classification.type})
                                </option>
                            ))}
                        </Form.Select>s
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Time Range</Form.Label>
                        <Form.Select value={timeRange} onChange={handleTimeRangeChange}>
                            <option value="day">Last 24 Hours</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Energy Consumption Over Time</Card.Title>
                            <Plot
                                data={[energyConsumptionData]}
                                layout={{
                                    height: 400,
                                    margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
                                    xaxis: { title: 'Time' },
                                    yaxis: { title: 'Energy (kWh)' }
                                }}
                                useResizeHandler={true}
                                style={{ width: '100%' }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Power Demand Over Time</Card.Title>
                            <Plot
                                data={[powerData]}
                                layout={{
                                    height: 400,
                                    margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
                                    xaxis: { title: 'Time' },
                                    yaxis: { title: 'Power (kW)' }
                                }}
                                useResizeHandler={true}
                                style={{ width: '100%' }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Energy Distribution by Classification</Card.Title>
                            <Plot
                                data={[getEnergyByClassification()]}
                                layout={{
                                    height: 400,
                                    margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 }
                                }}
                                useResizeHandler={true}
                                style={{ width: '100%' }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Average Power by Hour of Day</Card.Title>
                            <Plot
                                data={[getHourlyAverages()]}
                                layout={{
                                    height: 400,
                                    margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
                                    xaxis: {
                                        title: 'Hour of Day',
                                        tickvals: Array.from({ length: 24 }, (_, i) => i),
                                        ticktext: Array.from({ length: 24 }, (_, i) => i)
                                    },
                                    yaxis: { title: 'Average Power (kW)' }
                                }}
                                useResizeHandler={true}
                                style={{ width: '100%' }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;