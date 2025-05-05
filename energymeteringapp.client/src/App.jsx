import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";
import Dashboard from "./components/Dashboard";
import ClassificationManager from "./components/ClassificationManager";
import DataGenerator from "./components/DataGenerator";
import Reports from "./components/Reports";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    return (
        <Router>
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
                                <Nav.Link as={Link} to="/reports">Reports</Nav.Link>
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
                    </Routes>
                </Container>
            </div>
        </Router>
    );
}

export default App;