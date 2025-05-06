// src/components/EnhancedChart.jsx
import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import Plot from 'react-plotly.js';

const EnhancedChart = ({
    data,
    layout,
    title,
    loading = false,
    emptyMessage = 'No data available',
    height = 400,
    type = 'scatter',
    config = {},
    defaultLayout = {}
}) => {
    // Check if data is empty
    const isEmpty = !data || (Array.isArray(data) && data.length === 0) ||
        (typeof data === 'object' && Object.keys(data).length === 0);

    // Handle loading state
    if (loading) {
        return (
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>{title}</Card.Title>
                    <div className="d-flex justify-content-center align-items-center" style={{ height: `${height}px` }}>
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // Handle empty data state
    if (isEmpty) {
        return (
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>{title}</Card.Title>
                    <div
                        className="d-flex justify-content-center align-items-center text-muted"
                        style={{ height: `${height}px` }}
                    >
                        {emptyMessage}
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // Merge default layout with provided layout
    const mergedLayout = {
        height,
        title,
        margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
        ...defaultLayout,
        ...layout
    };

    // Merge default config with provided config
    const mergedConfig = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: title?.replace(/\s+/g, '_').toLowerCase() || 'chart',
            height: height,
            width: 1200,
            scale: 2
        },
        ...config
    };

    // Create plot data if simple array data is provided
    const plotData = Array.isArray(data) ? data : [data];

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                <Plot
                    data={plotData}
                    layout={mergedLayout}
                    config={mergedConfig}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </Card.Body>
        </Card>
    );
};

export default EnhancedChart;