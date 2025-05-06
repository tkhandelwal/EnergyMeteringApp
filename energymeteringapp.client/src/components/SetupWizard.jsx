// src/components/SetupWizard.jsx
import React, { useState } from 'react';
import { Card, Button, ProgressBar, Container, Alert } from 'react-bootstrap';
import ClassificationSetup from './wizard/ClassificationSetup';
import BaselineSetup from './wizard/BaselineSetup';
import EnPISetup from './wizard/EnPISetup';
import TargetSetup from './wizard/TargetSetup';
import apiService from '../services/apiService';

const SetupWizard = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [setupData, setSetupData] = useState({
        classifications: [],
        baselines: [],
        enpiDefinitions: [],
        targets: []
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const totalSteps = 4;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClassificationData = (classifications) => {
        setSetupData({
            ...setupData,
            classifications
        });
    };

    const handleBaselineData = (baselines) => {
        setSetupData({
            ...setupData,
            baselines
        });
    };

    const handleEnPIData = (enpiDefinitions) => {
        setSetupData({
            ...setupData,
            enpiDefinitions
        });
    };

    const handleTargetData = (targets) => {
        setSetupData({
            ...setupData,
            targets
        });
    };

    const saveSetupData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Save classifications
            for (const classification of setupData.classifications) {
                await apiService.createClassification(classification);
            }

            // Step 2: Save baselines (implementation depends on your API)
            for (const baseline of setupData.baselines) {
                await apiService.createBaseline(baseline);
            }

            // Step 3: Save EnPI definitions
            for (const enpi of setupData.enpiDefinitions) {
                await apiService.createEnPIDefinition(enpi);
            }

            // Step 4: Save targets
            for (const target of setupData.targets) {
                await apiService.createTarget(target);
            }

            // Call the onComplete callback
            onComplete();
        } catch (error) {
            setError(`Setup failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <ClassificationSetup onData={handleClassificationData} data={setupData.classifications} />;
            case 2:
                return <BaselineSetup onData={handleBaselineData} data={setupData.baselines} classifications={setupData.classifications} />;
            case 3:
                return <EnPISetup onData={handleEnPIData} data={setupData.enpiDefinitions} classifications={setupData.classifications} />;
            case 4:
                return <TargetSetup onData={handleTargetData} data={setupData.targets} enpiDefinitions={setupData.enpiDefinitions} />;
            default:
                return null;
        }
    };

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header>
                    <h3>ISO 50001 Energy Management Setup</h3>
                    <ProgressBar now={(currentStep / totalSteps) * 100} label={`Step ${currentStep} of ${totalSteps}`} />
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    {renderCurrentStep()}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between">
                    <Button
                        variant="secondary"
                        onClick={handlePrevious}
                        disabled={currentStep === 1 || isLoading}
                    >
                        Previous
                    </Button>

                    {currentStep < totalSteps ? (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            disabled={isLoading}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="success"
                            onClick={saveSetupData}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Complete Setup'}
                        </Button>
                    )}
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default SetupWizard;