// Create a new file: src/components/ExportButton.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { exportToCSV } from '../utils/exportUtils';

const ExportButton = ({ data, filename, label = "Export to CSV" }) => {
    const handleExport = () => {
        if (!data || data.length === 0) {
            alert('No data available to export.');
            return;
        }

        const success = exportToCSV(data, filename);
        if (!success) {
            alert('Failed to export data. Please try again.');
        }
    };

    return (
        <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleExport}
            disabled={!data || data.length === 0}
        >
            {label}
        </Button>
    );
};

export default ExportButton;