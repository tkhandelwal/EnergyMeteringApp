// src/App.jsx (modified)
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { Container, Nav, Navbar, NavDropdown, Alert, Button } from "react-bootstrap";
import { EnergyDataProvider } from './contexts/EnergyDataContext';
import Dashboard from "./components/Dashboard";
import ClassificationManager from "./components/ClassificationManager";
import DataGenerator from "./components/DataGenerator";
import Reports from "./components/Reports";
import EnPIManager from "./components/EnPIManager";
import EnergyFlowAnalysis from "./components/EnergyFlowAnalysis";
import ParetoAnalysis from "./components/ParetoAnalysis";
import SystemStatus from "./components/SystemStatus";
import AdvancedAnalysis from "./components/AdvancedAnalysis";
import SetupWizard from "./components/SetupWizard";
import apiService from "./services/apiService";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [systemConfigured, setSystemConfigured] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkSystemConfiguration();
    }, []);

    const checkSystemConfiguration = async () => {
        setLoading(true);
        try {
            const classifications = await apiService.getClassifications();
            setSystemConfigured(classifications && classifications.length > 0);
        } catch (error) {
            console.error("Failed to check system configuration:", error);
            setError("Failed to connect to the server. Please check if the backend is running.");
            setSystemConfigured(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSetupComplete = () => {
        setSystemConfigured(true);
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Checking system configuration...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    <Alert.Heading>Connection Error</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={checkSystemConfiguration}>
                            Retry Connection
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    if (systemConfigured === false) {
        return <SetupWizard onComplete={handleSetupComplete} />;
    }

    return (
        <Router>
            <EnergyDataProvider>
                <div className="App">
                    <Navbar bg="dark" variant="dark" expand="lg">
                        <Container>
                            <Navbar.Brand as={Link} to="/">Energy Metering Dashboard</Navbar.Brand>
                            <Navbar.Toggle aria-controls="basic-navbar-nav" />
                            <Navbar.Collapse id="basic-navbar-nav">
                                <Nav className="me-auto">
                                    <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                                    <Nav.Link as={Link} to="/classifications">Classifications</Nav.Link>
                                    <Nav.Link as={Link} to="/generator">Data Generator</Nav.Link>
                                    <NavDropdown title="Analytics" id="analytics-dropdown">
                                        <NavDropdown.Item as={Link} to="/reports">Standard Reports</NavDropdown.Item>
                                        <NavDropdown.Item as={Link} to="/enpi">EnPI Manager</NavDropdown.Item>
                                        <NavDropdown.Item as={Link} to="/energy-flow">Energy Flow Analysis</NavDropdown.Item>
                                        <NavDropdown.Item as={Link} to="/pareto">Pareto Analysis</NavDropdown.Item>
                                        <NavDropdown.Item as={Link} to="/advanced">Advanced Analysis</NavDropdown.Item>
                                    </NavDropdown>
                                    <Nav.Link as={Link} to="/system-status">System Status</Nav.Link>
                                </Nav>
                            </Navbar.Collapse>
                        </Container>
                    </Navbar>

                    <Container className="mt-4">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/classifications" element={<ClassificationManager />} />
                            <Route path="/generator" element={<DataGenerator />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/enpi" element={<EnPIManager />} />
                            <Route path="/energy-flow" element={<EnergyFlowAnalysis />} />
                            <Route path="/pareto" element={<ParetoAnalysis />} />
                            <Route path="/system-status" element={<SystemStatus />} />
                            <Route path="/advanced" element={<AdvancedAnalysis />} />
                            <Route path="/setup" element={<SetupWizard onComplete={handleSetupComplete} />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </Container>
                </div>
            </EnergyDataProvider>
        </Router>
    );
}

export default App;