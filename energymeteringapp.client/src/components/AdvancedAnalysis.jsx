// src/components/AdvancedAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Table } from 'react-bootstrap';
import { useEnergyData } from '../contexts/EnergyDataContext';
import EnhancedChart from './EnhancedChart';
import moment from 'moment';

const AdvancedAnalysis = () => {
    const { meteringData, classifications, loading } = useEnergyData();
    const [analysisConfig, setAnalysisConfig] = useState({
        startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        classificationIds: [],
        viewType: 'hourlyHeatmap',
        comparisonType: 'none'
    });

    const [analysisData, setAnalysisData] = useState(null);

    // Update analysis when configs change
    useEffect(() => {
        if (meteringData.length > 0) {
            performAnalysis();
        }
    }, [analysisConfig, meteringData]);

    const handleConfigChange = (e) => {
        const { name, value, type } = e.target;

        if (name === 'classificationIds' && type === 'select-multiple') {
            const options = e.target.options;
            const selectedValues = [];
            for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                    selectedValues.push(parseInt(options[i].value));
                }
            }

            setAnalysisConfig({
                ...analysisConfig,
                classificationIds: selectedValues
            });
        } else {
            setAnalysisConfig({
                ...analysisConfig,
                [name]: value
            });
        }
    };

    const performAnalysis = () => {
        // Filter data based on dates and classifications
        let filteredData = meteringData.filter(data =>
            moment(data.timestamp).isBetween(
                moment(analysisConfig.startDate),
                moment(analysisConfig.endDate),
                undefined,
                '[]'
            )
        );

        // Filter by classifications if selected
        if (analysisConfig.classificationIds.length > 0) {
            filteredData = filteredData.filter(data =>
                analysisConfig.classificationIds.includes(data.classificationId)
            );
        }

        // Perform different analyses based on viewType
        switch (analysisConfig.viewType) {
            case 'hourlyHeatmap':
                setAnalysisData(generateHourlyHeatmap(filteredData));
                break;
            case 'weekdayComparison':
                setAnalysisData(generateWeekdayComparison(filteredData));
                break;
            case 'consumptionTrend':
                setAnalysisData(generateConsumptionTrend(filteredData));
                break;
            case 'classificationComparison':
                setAnalysisData(generateClassificationComparison(filteredData));
                break;
            default:
                setAnalysisData(null);
        }
    };

    // Generate hourly heatmap data
    const generateHourlyHeatmap = (data) => {
        // Create 2D grid for day of week vs hour of day
        const heatmapData = Array(7).fill().map(() => Array(24).fill(0));
        const countData = Array(7).fill().map(() => Array(24).fill(0));

        data.forEach(item => {
            const date = new Date(item.timestamp);
            const dayOfWeek = date.getDay(); // 0-6
            const hourOfDay = date.getHours(); // 0-23

            heatmapData[dayOfWeek][hourOfDay] += item.power;
            countData[dayOfWeek][hourOfDay]++;
        });

        // Calculate averages
        const avgData = heatmapData.map((day, dayIndex) =>
            day.map((total, hourIndex) =>
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

    // Generate weekday comparison data
    const generateWeekdayComparison = (data) => {
        const weekdayData = Array(7).fill(0);
        const countData = Array(7).fill(0);

        data.forEach(item => {
            const dayOfWeek = new Date(item.timestamp).getDay();
            weekdayData[dayOfWeek] += item.energyValue;
            countData[dayOfWeek]++;
        });

        // Calculate averages
        const avgData = weekdayData.map((total, index) =>
            countData[index] > 0 ? total / countData[index] : 0
        );

        return {
            x: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            y: avgData,
            type: 'bar',
            marker: {
                color: 'rgba(55, 128, 191, 0.7)'
            }
        };
    };

    // Generate consumption trend data
    const generateConsumptionTrend = (data) => {
        // Group by date
        const dailyData = {};

        data.forEach(item => {
            const dateStr = moment(item.timestamp).format('YYYY-MM-DD');
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = {
                    energy: 0,
                    power: 0,
                    count: 0
                };
            }

            dailyData[dateStr].energy += item.energyValue;
            dailyData[dateStr].power += item.power;
            dailyData[dateStr].count++;
        });

        // Convert to arrays for plotting
        const dates = Object.keys(dailyData).sort();
        const energyValues = dates.map(date => dailyData[date].energy);
        const powerValues = dates.map(date =>
            dailyData[date].count > 0
                ? dailyData[date].power / dailyData[date].count
                : 0
        );

        return [
            {
                x: dates,
                y: energyValues,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Energy (kWh)',
                marker: { color: 'blue' }
            },
            {
                x: dates,
                y: powerValues,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Avg Power (kW)',
                yaxis: 'y2',
                marker: { color: 'red' }
            }
        ];
    };

    // Generate classification comparison data
    const generateClassificationComparison = (data) => {
        // Group by classification
        const classData = {};

        data.forEach(item => {
            const classId = item.classificationId;
            const className = classifications.find(c => c.id === classId)?.name || 'Unknown';

            if (!classData[className]) {
                classData[className] = {
                    energy: 0,
                    maxPower: 0,
                    totalPower: 0,
                    count: 0
                };
            }

            classData[className].energy += item.energyValue;
            classData[className].maxPower = Math.max(classData[className].maxPower, item.power);
            classData[className].totalPower += item.power;
            classData[className].count++;
        });

        // Calculate values for comparison
        const classNames = Object.keys(classData);
        const energyValues = classNames.map(name => classData[name].energy);
        const avgPowerValues = classNames.map(name =>
            classData[name].count > 0
                ? classData[name].totalPower / classData[name].count
                : 0
        );

        // Sort by energy consumption (descending)
        const sortedIndices = energyValues
            .map((val, idx) => ({ val, idx }))
            .sort((a, b) => b.val - a.val)
            .map(item => item.idx);

        const sortedNames = sortedIndices.map(idx => classNames[idx]);
        const sortedEnergy = sortedIndices.map(idx => energyValues[idx]);
        const sortedPower = sortedIndices.map(idx => avgPowerValues[idx]);

        return [
            {
                x: sortedNames,
                y: sortedEnergy,
                type: 'bar',
                name: 'Energy (kWh)',
                marker: { color: 'rgba(55, 128, 191, 0.7)' }
            },
            {
                x: sortedNames,
                y: sortedPower,
                type: 'bar',
                name: 'Avg Power (kW)',
                marker: { color: 'rgba(219, 64, 82, 0.7)' }
            }
        ];
    };

    // Get layout based on view type
    const getChartLayout = () => {
        const baseLayout = {
            height: 500,
            margin: { l: 60, r: 60, b: 100, t: 50, pad: 4 }
        };

        switch (analysisConfig.viewType) {
            case 'hourlyHeatmap':
                return {
                    ...baseLayout,
                    title: 'Energy Usage by Hour and Day',
                    xaxis: {
                        title: 'Hour of Day',
                        tickvals: Array.from({ length: 24 }, (_, i) => i)
                    },
                    yaxis: {
                        title: 'Day of Week'
                    }
                };

            case 'weekdayComparison':
                return {
                    ...baseLayout,
                    title: 'Average Energy Usage by Day of Week',
                    xaxis: {
                        title: 'Day of Week'
                    },
                    yaxis: {
                        title: 'Average Energy (kWh)'
                    }
                };

            case 'consumptionTrend':
                return {
                    ...baseLayout,
                    title: 'Energy Consumption Trend',
                    xaxis: {
                        title: 'Date',
                        tickangle: -45
                    },
                    yaxis: {
                        title: 'Energy (kWh)'
                    },
                    yaxis2: {
                        title: 'Power (kW)',
                        titlefont: { color: 'red' },
                        tickfont: { color: 'red' },
                        overlaying: 'y',
                        side: 'right'
                    },
                    legend: {
                        orientation: 'h',
                        y: -0.2
                    }
                };

            case 'classificationComparison':
                return {
                    ...baseLayout,
                    title: 'Energy Consumption by Classification',
                    xaxis: {
                        title: 'Classification',
                        tickangle: -45
                    },
                    yaxis: {
                        title: 'Energy (kWh)'
                    },
                    barmode: 'group',
                    legend: {
                        orientation: 'h',
                        y: -0.2
                    }
                };

            default:
                return baseLayout;
        }
    };

    return (
        <div>
            <h2>Advanced Energy Analysis</h2>

            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={analysisConfig.startDate}
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
                                    value={analysisConfig.endDate}
                                    onChange={handleConfigChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>View Type</Form.Label>
                                <Form.Select
                                    name="viewType"
                                    value={analysisConfig.viewType}
                                    onChange={handleConfigChange}
                                >
                                    <option value="hourlyHeatmap">Hourly Heatmap</option>
                                    <option value="weekdayComparison">Weekday Comparison</option>
                                    <option value="consumptionTrend">Consumption Trend</option>
                                    <option value="classificationComparison">Classification Comparison</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Comparison</Form.Label>
                                <Form.Select
                                    name="comparisonType"
                                    value={analysisConfig.comparisonType}
                                    onChange={handleConfigChange}
                                >
                                    <option value="none">None</option>
                                    <option value="previousPeriod">Previous Period</option>
                                    <option value="yearOverYear">Year over Year</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Classifications (Hold Ctrl/Cmd to select multiple)</Form.Label>
                                <Form.Select
                                    name="classificationIds"
                                    multiple
                                    value={analysisConfig.classificationIds}
                                    onChange={handleConfigChange}
                                    style={{ height: '100px' }}
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

                    <Button
                        variant="primary"
                        onClick={performAnalysis}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Update Analysis'}
                    </Button>
                </Card.Body>
            </Card>

            <EnhancedChart
                data={analysisData}
                layout={getChartLayout()}
                title={`Energy Analysis - ${analysisConfig.viewType}`}
                loading={loading}
                emptyMessage="No data available for the selected criteria"
            />
        </div>
    );
};

export default AdvancedAnalysis;