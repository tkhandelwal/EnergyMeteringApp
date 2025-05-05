// src/components/Reports.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import moment from 'moment';

const Reports = () => {
    const [meteringData, setMeteringData] = useState([]);
    const [classifications, setClassifications] = useState([]);
    const [reportConfig, setReportConfig] = useState({
        startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        classificationIds: [],
        reportType: 'energyFlow'
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

    const handleChange = (e) => {
        if (e.target.name === 'classificationIds') {
            // Handle multi-select
            const options = e.target.options;
            const selectedValues = [];
            for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                    selectedValues.push(parseInt(options[i].value));
                }
            }
            setReportConfig({
                ...reportConfig,
                classificationIds: selectedValues
            });
        } else {
            setReportConfig({
                ...reportConfig,
                [e.target.name]: e.target.value
            });
        }
    };

    const getFilteredData = () => {
        let filtered = [...meteringData];

        // Filter by date range
        filtered = filtered.filter(data =>
            moment(data.timestamp).isBetween(
                moment(reportConfig.startDate),
                moment(reportConfig.endDate),
                undefined,
                '[]'
            )
        );

        // Filter by selected classifications
        if (reportConfig.classificationIds.length > 0) {
            filtered = filtered.filter(data =>
                reportConfig.classificationIds.includes(data.classificationId));
        }

        return filtered;
    };

    const getEnergySankeyData = () => {
        const filteredData = getFilteredData();

        // Group by classification type and then by name
        const energyFlowData = {};
        const typeMap = {};

        // Create mapping of classification IDs to their types
        classifications.forEach(classification => {
            typeMap[classification.id] = classification.type;
        });

        // Aggregate energy by type and name
        filteredData.forEach(data => {
            const classType = typeMap[data.classificationId] || 'Unknown';
            const className = data.classification?.name || 'Unknown';

            if (!energyFlowData[classType]) {
                energyFlowData[classType] = {};
            }

            if (!energyFlowData[classType][className]) {
                energyFlowData[classType][className] = 0;
            }

            energyFlowData[classType][className] += data.energyValue;
        });

        // Prepare Sankey diagram data
        const nodes = [];
        const links = [];
        let nodeIndex = 0;

        // Add facility as source node
        nodes.push({ name: 'Data Center' });

        // Process each type
        Object.keys(energyFlowData).forEach(type => {
            const typeNodeIndex = nodeIndex + 1;
            nodes.push({ name: type });

            // Link from source to type
            links.push({
                source: 0,
                target: typeNodeIndex,
                value: Object.values(energyFlowData[type]).reduce((a, b) => a + b, 0)
            });

            // Process each name within type
            Object.keys(energyFlowData[type]).forEach(name => {
                nodeIndex++;
                const nameNodeIndex = nodeIndex + 1;
                nodes.push({ name: name });

                // Link from type to name
                links.push({
                    source: typeNodeIndex,
                    target: nameNodeIndex,
                    value: energyFlowData[type][name]
                });
            });

            nodeIndex++;
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

    const getParetoData = () => {
        const filteredData = getFilteredData();

        // Group data by classification
        const energyByClass = {};

        filteredData.forEach(data => {
            const className = data.classification?.name || 'Unknown';
            if (!energyByClass[className]) {
                energyByClass[className] = 0;
            }
            energyByClass[className] += data.energyValue;
        });

        // Sort by energy consumption (descending)
        const sortedData = Object.entries(energyByClass)
            .sort((a, b) => b[1] - a[1]);

        // Calculate cumulative percentages
        const totalEnergy = sortedData.reduce((sum, [_, value]) => sum + value, 0);
        let cumulativeSum = 0;

        const paretoData = sortedData.map(([name, value]) => {
            cumulativeSum += value;
            return {
                name,
                value,
                cumulativePercent: (cumulativeSum / totalEnergy) * 100
            };
        });

        // Prepare data for Plotly
        return [
            {
                x: paretoData.map(d => d.name),
                y: paretoData.map(d => d.value),
                type: 'bar',
                name: 'Energy Consumption (kWh)'
            },
            {
                x: paretoData.map(d => d.name),
                y: paretoData.map(d => d.cumulativePercent),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Cumulative %',
                yaxis: 'y2',
                line: { color: 'red' }
            }
        ];
    };

    const getEnPIData = () => {
        const filteredData = getFilteredData();

        // Group by classification and calculate EnPI (Energy per time period)
        const classData = {};
        const timeRangeHours = moment(reportConfig.endDate).diff(moment(reportConfig.startDate), 'hours');

        filteredData.forEach(data => {
            const className = data.classification?.name || 'Unknown';
            if (!classData[className]) {
                classData[className] = {
                    totalEnergy: 0,
                    maxPower: 0
                };
            }

            classData[className].totalEnergy += data.energyValue;
            if (data.power > classData[className].maxPower) {
                classData[className].maxPower = data.power;
            }
        });

        // Calculate EnPI values (kWh/hour and kW max)
        const enpiData = Object.entries(classData).map(([name, data]) => ({
            name,
            energyPerHour: data.totalEnergy / timeRangeHours,
            maxPower: data.maxPower
        }));

        // Sort by energy intensity
        enpiData.sort((a, b) => b.energyPerHour - a.energyPerHour);

        return [
            {
                x: enpiData.map(d => d.name),
                y: enpiData.map(d => d.energyPerHour),
                type: 'bar',
                name: 'Energy Intensity (kWh/hr)'
            },
            {
                x: enpiData.map(d => d.name),
                y: enpiData.map(d => d.maxPower),
                type: 'bar',
                name: 'Max Power (kW)',
                marker: { color: 'orange' }
            }
        ];
    };

    // Render the appropriate report based on selection
    const renderReport = () => {
        const filteredData = getFilteredData();

        if (filteredData.length === 0) {
            return (
                <Card>
                    <Card.Body>
                        <p>No data available for the selected criteria. Please generate data or adjust your selection.</p>
                    </Card.Body>
                </Card>
            );
        }

        switch (reportConfig.reportType) {
            case 'energyFlow':
                return (
                    <Card>
                        <Card.Body>
                            <Card.Title>Energy Flow Sankey Diagram</Card.Title>
                            <Plot
                                data={[getEnergySankeyData()]}
                                layout={{
                                    height: 600,
                                    margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
                                    title: 'Energy Flow by Classification'
                                }}
                                useResizeHandler={true}
                                style={{ width: '100%' }}
                            />
                        </Card.Body>
                    </Card>
                );

            case 'pareto':
                return (
                    <Card>
                        <Card.Body>
                            <Card.Title>Pareto Analysis of Energy Consumption</Card.Title>
                            <Plot
                                data={getParetoData()}
                                layout={{
                                    height: 500,
                                    margin: { l: 50, r: 50, b: 100, t: 50, pad: 4 },
                                    title: 'Pareto Chart of Energy Consumption',
                                    xaxis: {
                                        title: 'Classification',
                                        tickangle: -45
                                    },
                                    yaxis: {
                                        title: 'Energy Consumption (kWh)'
                                    },
                                    yaxis2: {
                                        title: 'Cumulative Percentage',
                                        titlefont: { color: 'red' },
                                        tickfont: { color: 'red' },
                                        overlaying: 'y',
                                        side: 'right',
                                        range: [0, 100]
                                    },
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

            case 'enpi':
                return (
                    <Card>
                        <Card.Body>
                            <Card.Title>Energy Performance Indicators</Card.Title>
                            <Plot
                                data={getEnPIData()}
                                layout={{
                                    height: 500,
                                    margin: { l: 50, r: 50, b: 100, t: 50, pad: 4 },
                                    title: 'Energy Performance Indicators by Classification',
                                    xaxis: {
                                        title: 'Classification',
                                        tickangle: -45
                                    },
                                    yaxis: {
                                        title: 'Value'
                                    },
                                    barmode: 'group',
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

            default:
                return null;
        }
    };

    return (
        <div>
            <h2>Energy Reports</h2>

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Report Configuration</Card.Title>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={reportConfig.startDate}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={reportConfig.endDate}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Classifications (Hold Ctrl/Cmd to select multiple)</Form.Label>
                                    <Form.Select
                                        name="classificationIds"
                                        multiple
                                        value={reportConfig.classificationIds}
                                        onChange={handleChange}
                                        style={{ height: '150px' }}
                                    >
                                        {classifications.map(classification => (
                                            <option key={classification.id} value={classification.id}>
                                                {classification.name} ({classification.type})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Report Type</Form.Label>
                                    <Form.Select
                                        name="reportType"
                                        value={reportConfig.reportType}
                                        onChange={handleChange}
                                    >
                                        <option value="energyFlow">Energy Flow Sankey</option>
                                        <option value="pareto">Pareto Analysis</option>
                                        <option value="enpi">Energy Performance Indicators</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {renderReport()}

            <Card className="mt-4">
                <Card.Body>
                    <Card.Title>Data Table</Card.Title>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Classification</th>
                                    <th>Type</th>
                                    <th>Total Energy (kWh)</th>
                                    <th>Max Power (kW)</th>
                                    <th>Avg Power (kW)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filteredData = getFilteredData();
                                    const classData = {};

                                    // Aggregate data by classification
                                    filteredData.forEach(data => {
                                        const className = data.classification?.name || 'Unknown';
                                        const classType = data.classification?.type || 'Unknown';

                                        if (!classData[className]) {
                                            classData[className] = {
                                                type: classType,
                                                totalEnergy: 0,
                                                maxPower: 0,
                                                readings: 0
                                            };
                                        }

                                        classData[className].totalEnergy += data.energyValue;
                                        classData[className].readings++;

                                        if (data.power > classData[className].maxPower) {
                                            classData[className].maxPower = data.power;
                                        }
                                    });

                                    // Convert to array and calculate averages
                                    return Object.entries(classData).map(([name, data], index) => (
                                        <tr key={index}>
                                            <td>{name}</td>
                                            <td>{data.type}</td>
                                            <td>{data.totalEnergy.toFixed(2)}</td>
                                            <td>{data.maxPower.toFixed(2)}</td>
                                            <td>
                                                {data.readings > 0
                                                    ? (data.totalEnergy / data.readings * 4).toFixed(2)
                                                    : 0}
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Reports;