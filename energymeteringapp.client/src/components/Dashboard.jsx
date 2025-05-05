// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import moment from 'moment';
import apiService from '../services/apiService';
import { exportMeteringData } from '../utils/exportUtils';

const Dashboard = () => {
    const [meteringData, setMeteringData] = useState([]);
    const [classifications, setClassifications] = useState([]);
    const [selectedClassification, setSelectedClassification] = useState('all');
    const [timeRange, setTimeRange] = useState('day');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch classifications and metering data in parallel
            const [classificationsResponse, meteringDataResponse] = await Promise.all([
                apiService.getClassifications(),
                apiService.getMeteringData()
            ]);

            setClassifications(classificationsResponse);
            setMeteringData(meteringDataResponse);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load data. Please try again later.');

            // Try fallback APIs
            try {
                const [fallbackClassifications, fallbackMeteringData] = await Promise.all([
                    apiService.fallback.getClassifications(),
                    apiService.fallback.getMeteringData()
                ]);

                setClassifications(fallbackClassifications);
                setMeteringData(fallbackMeteringData);
                setError(null); // Clear error if fallback succeeds
            } catch (fallbackError) {
                console.error('Fallback API also failed:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClassificationChange = (e) => {
        setSelectedClassification(e.target.value);
    };

    const handleTimeRangeChange = (e) => {
        setTimeRange(e.target.value);
    };

    const handleExport = () => {
        const filename = `energy-data-${selectedClassification !== 'all' ? selectedClassification : 'all'}-${timeRange}.csv`;
        const success = exportMeteringData(filteredData, filename);

        if (!success) {
            setError('Failed to export data. Please try again.');
            setTimeout(() => setError(null), 3000);
        }
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

    // Calculate summary metrics
    const calculateSummaryMetrics = () => {
        if (!filteredData || filteredData.length === 0) {
            return {
                totalEnergy: 0,
                maxPower: 0,
                avgPower: 0,
                readingCount: 0
            };
        }

        const totalEnergy = filteredData.reduce((sum, item) => sum + item.energyValue, 0);
        const maxPower = Math.max(...filteredData.map(item => item.power));
        const avgPower = filteredData.reduce((sum, item) => sum + item.power, 0) / filteredData.length;

        return {
            totalEnergy: totalEnergy.toFixed(2),
            maxPower: maxPower.toFixed(2),
            avgPower: avgPower.toFixed(2),
            readingCount: filteredData.length
        };
    };

    const summaryMetrics = calculateSummaryMetrics();

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

            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center h-100 mb-3 mb-md-0">
                        <Card.Body>
                            <Card.Title>Total Energy</Card.Title>
                            <div className="display-6">{summaryMetrics.totalEnergy}</div>
                            <div className="text-muted">kWh</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 mb-3 mb-md-0">
                        <Card.Body>
                            <Card.Title>Max Power</Card.Title>
                            <div className="display-6">{summaryMetrics.maxPower}</div>
                            <div className="text-muted">kW</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 mb-3 mb-md-0">
                        <Card.Body>
                            <Card.Title>Avg Power</Card.Title>
                            <div className="display-6">{summaryMetrics.avgPower}</div>
                            <div className="text-muted">kW</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100">
                        <Card.Body>
                            <Card.Title>Readings</Card.Title>
                            <div className="display-6">{summaryMetrics.readingCount}</div>
                            <div className="text-muted">data points</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

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
                        </Form.Select>
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

            {/* Export and Refresh buttons */}
            <Row className="mb-3">
                <Col>
                    <div className="d-flex justify-content-end">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleExport}
                            disabled={filteredData.length === 0 || loading}
                            className="me-2"
                        >
                            Export to CSV
                        </Button>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={fetchData}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-1"
                                    />
                                    Loading...
                                </>
                            ) : 'Refresh Data'}
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Energy Consumption Over Time</Card.Title>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <p className="text-center py-3">No data available for the selected criteria.</p>
                            ) : (
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
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Power Demand Over Time</Card.Title>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <p className="text-center py-3">No data available for the selected criteria.</p>
                            ) : (
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
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Energy Distribution by Classification</Card.Title>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </div>
                            ) : meteringData.length === 0 ? (
                                <p className="text-center py-3">No data available.</p>
                            ) : (
                                <Plot
                                    data={[getEnergyByClassification()]}
                                    layout={{
                                        height: 400,
                                        margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 }
                                    }}
                                    useResizeHandler={true}
                                    style={{ width: '100%' }}
                                />
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Average Power by Hour of Day</Card.Title>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <p className="text-center py-3">No data available for the selected criteria.</p>
                            ) : (
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
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;