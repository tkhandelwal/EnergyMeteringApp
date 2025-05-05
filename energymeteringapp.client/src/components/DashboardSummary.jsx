// Create a new file: src/components/DashboardSummary.jsx
import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const DashboardSummary = ({ meteringData }) => {
    // Prevent errors if data is empty or not yet loaded
    if (!meteringData || meteringData.length === 0) {
        return (
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Text>No metering data available. Generate some data to see metrics.</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    // Calculate metrics
    const totalEnergy = meteringData.reduce((sum, item) => sum + item.energyValue, 0).toFixed(2);
    const maxPower = Math.max(...meteringData.map(item => item.power)).toFixed(2);
    const avgPower = (meteringData.reduce((sum, item) => sum + item.power, 0) / meteringData.length).toFixed(2);
    const readingCount = meteringData.length;

    return (
        <Row className="mb-4">
            <Col md={3}>
                <Card className="text-center h-100 mb-3 mb-md-0">
                    <Card.Body>
                        <Card.Title>Total Energy</Card.Title>
                        <div className="display-6">{totalEnergy}</div>
                        <div className="text-muted">kWh</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={3}>
                <Card className="text-center h-100 mb-3 mb-md-0">
                    <Card.Body>
                        <Card.Title>Max Power</Card.Title>
                        <div className="display-6">{maxPower}</div>
                        <div className="text-muted">kW</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={3}>
                <Card className="text-center h-100 mb-3 mb-md-0">
                    <Card.Body>
                        <Card.Title>Avg Power</Card.Title>
                        <div className="display-6">{avgPower}</div>
                        <div className="text-muted">kW</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={3}>
                <Card className="text-center h-100">
                    <Card.Body>
                        <Card.Title>Readings</Card.Title>
                        <div className="display-6">{readingCount}</div>
                        <div className="text-muted">data points</div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default DashboardSummary;