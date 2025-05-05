// Create a new file: src/components/ComparisonChart.jsx
import React from 'react';
import { Card } from 'react-bootstrap';
import Plot from 'react-plotly.js';

const ComparisonChart = ({ data, title, xLabel, yLabel, colorScale = 'Blues' }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>{title || 'Comparison Chart'}</Card.Title>
                    <p>No data available for comparison.</p>
                </Card.Body>
            </Card>
        );
    }

    // Sort by values descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const plotData = [{
        x: sortedData.map(item => item.name),
        y: sortedData.map(item => item.value),
        type: 'bar',
        marker: {
            color: sortedData.map((_, i) => (sortedData.length - i) / sortedData.length),
            colorscale: colorScale
        }
    }];

    const layout = {
        title: title || 'Comparison Chart',
        height: 400,
        margin: { l: 50, r: 30, b: 80, t: 50, pad: 4 },
        xaxis: {
            title: xLabel || '',
            tickangle: -45
        },
        yaxis: {
            title: yLabel || ''
        }
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                <Plot
                    data={plotData}
                    layout={layout}
                    useResizeHandler={true}
                    style={{ width: '100%' }}
                />
            </Card.Body>
        </Card>
    );
};

export default ComparisonChart;