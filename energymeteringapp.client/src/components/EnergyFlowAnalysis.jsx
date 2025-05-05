// src/components/EnergyFlowAnalysis.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import moment from 'moment';

const EnergyFlowAnalysis = () => {
    const [meteringData, setMeteringData] = useState([]);
    const [classifications, setClassifications] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD')
    });
    const [view, setView] = useState('sankey');

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

    const handleDateChange = (e) => {
        setDateRange({
            ...dateRange,
            [e.target.name]: e.target.value
        });
    };

    const handleViewChange = (e) => {
        setView(e.target.value);
    };

    const getFilteredData = () => {
        // Filter by date range
        return meteringData.filter(data =>
            moment(data.timestamp).isBetween(
                moment(dateRange.startDate),
                moment(dateRange.endDate),
                undefined,
                '[]'
            )
        );
    };

    // Generate hierarchical sankey diagram
    const getSankeyData = () => {
        const filteredData = getFilteredData();

        // Create a mapping of classification types
        const typeMap = {};
        classifications.forEach(classification => {
            typeMap[classification.id] = classification.type;
        });

        // Group data by type and classification
        const energyByType = {};

        filteredData.forEach(data => {
            const type = typeMap[data.classificationId] || 'Unknown';
            const name = data.classification?.name || 'Unknown';

            if (!energyByType[type]) {
                energyByType[type] = {};
            }

            if (!energyByType[type][name]) {
                energyByType[type][name] = 0;
            }

            energyByType[type][name] += data.energyValue;
        });

        // Prepare sankey data
        const nodes = [];
        const links = [];

        // Add the root node (Data Center)
        nodes.push({ name: 'Data Center' });
        let nodeIndex = 0;

        // Process each type
        Object.keys(energyByType).forEach(type => {
            nodeIndex++;
            const typeNodeIndex = nodeIndex;
            nodes.push({ name: type });

            // Link from root to type
            const typeTotal = Object.values(energyByType[type])
                .reduce((sum, value) => sum + value, 0);

            links.push({
                source: 0,
                target: typeNodeIndex,
                value: typeTotal
            });

            // Process classifications within this type
            Object.keys(energyByType[type]).forEach(name => {
                nodeIndex++;
                nodes.push({ name });

                // Link from type to classification
                links.push({
                    source: typeNodeIndex,
                    target: nodeIndex,
                    value: energyByType[type][name]
                });
            });
        });

        return {
            node: {
                label: nodes.map(n => n.name),
                pad: 15,
                thickness: 20,
                line: {
                    color: "black",
                    width: 0.5
                }
            },
            link: {
                source: links.map(l => l.source),
                target: links.map(l => l.target),
                value: links.map(l => l.value)
            },
            type: 'sankey',
            orientation: 'h'
        };
    };

    // Generate treemap of energy usage
    const getTreemapData = () => {
        const filteredData = getFilteredData();

        // Create hierarchy levels
        const ids = ['Data Center'];
        const labels = ['Data Center'];
        const parents = [''];
        const values = [0];

        // Group energy by classification type
        const energyByType = {};
        const energyByClass = {};
        const typeMap = {};

        // Create mapping of classification ids to types
        classifications.forEach(classification => {
            typeMap[classification.id] = classification.type;
        });

        // Aggregate data
        filteredData.forEach(data => {
            const type = typeMap[data.classificationId] || 'Unknown';
            const className = data.classification?.name || 'Unknown';

            // Add to type aggregation
            if (!energyByType[type]) {
                energyByType[type] = 0;

                // Add type to hierarchy
                ids.push(type);
                labels.push(type);
                parents.push('Data Center');
                values.push(0);
            }

            // Add to classification aggregation
            const classKey = `${type}-${className}`;
            if (!energyByClass[classKey]) {
                energyByClass[classKey] = 0;

                // Add classification to hierarchy
                ids.push(classKey);
                labels.push(className);
                parents.push(type);
                values.push(0);
            }

            // Update values
            energyByClass[classKey] += data.energyValue;
            energyByType[type] += data.energyValue;
            values[0] += data.energyValue; // Update root node value
        });

        // Update values in arrays
        Object.keys(energyByType).forEach(type => {
            const index = ids.indexOf(type);
            if (index !== -1) {
                values[index] = energyByType[type];
            }
        });

        Object.keys(energyByClass).forEach(classKey => {
            const index = ids.indexOf(classKey);
            if (index !== -1) {
                values[index] = energyByClass[classKey];
            }
        });

        return {
            type: 'treemap',
            ids: ids,
            labels: labels,
            parents: parents,
            values: values,
            textinfo: "label+value+percent",
            marker: {
                colorscale: 'Viridis'
            }
        };
    };

    // Generate heatmap of energy usage patterns
    const getHeatmapData = () => {
        const filteredData = getFilteredData();

        // Create 2D grid for hour of day vs day of week
        const heatmapData = Array(7).fill().map(() => Array(24).fill(0));
        const countData = Array(7).fill().map(() => Array(24).fill(0));

        filteredData.forEach(data => {
            const date = new Date(data.timestamp);
            const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
            const hourOfDay = date.getHours(); // 0-23

            heatmapData[dayOfWeek][hourOfDay] += data.power;
            countData[dayOfWeek][hourOfDay]++;
        });

        // Calculate averages
        const avgData = heatmapData.map((dayData, dayIndex) =>
            dayData.map((total, hourIndex) =>
                countData[dayIndex][hourIndex] > 0
                    ? total / countData[dayIndex][hourIndex]
                    : 0
            )
        );

        return {
            z: avgData,
            x: Array.from({ length: 24 }, (_, i) => i),
            y: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            type: 'heatmap',
            colorscale: 'Viridis',
            colorbar: {
                title: 'Power (kW)'
            }
        };
    };

    const renderVisualization = () => {
        const filteredData = getFilteredData();

        if (filteredData.length === 0) {
            return (
                <p>No data available for the selected date range. Please generate data or adjust your selection.</p>
            );
        }

        switch (view) {
            case 'sankey':
                return (
                    <Plot
                        data={[getSankeyData()]}
                        layout={{
                            title: 'Energy Flow Sankey Diagram',
                            height: 600,
                            font: {
                                size: 12
                            }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%' }}
                    />
                );

            case 'treemap':
                return (
                    <Plot
                        data={[getTreemapData()]}
                        layout={{
                            title: 'Energy Consumption Treemap',
                            height: 600
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%' }}
                    />
                );

            case 'heatmap':
                return (
                    <Plot
                        data={[getHeatmapData()]}
                        layout={{
                            title: 'Energy Usage Patterns (Hour vs Day)',
                            height: 500,
                            xaxis: {
                                title: 'Hour of Day',
                                tickvals: Array.from({ length: 24 }, (_, i) => i)
                            },
                            yaxis: {
                                title: 'Day of Week'
                            }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%' }}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div>
            <h2>Energy Flow Analysis</h2>

            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={dateRange.startDate}
                                    onChange={handleDateChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={dateRange.endDate}
                                    onChange={handleDateChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Visualization Type</Form.Label>
                                <Form.Select
                                    value={view}
                                    onChange={handleViewChange}
                                >
                                    <option value="sankey">Sankey Diagram</option>
                                    <option value="treemap">Treemap</option>
                                    <option value="heatmap">Usage Pattern Heatmap</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    {renderVisualization()}
                </Card.Body>
            </Card>
        </div>
    );
};

export default EnergyFlowAnalysis;