// src/utils/exportUtils.js
/**
 * Exports data to a CSV file and triggers download
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file to download
 * @returns {Boolean} - Success status
 */
export const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
        console.error('No data to export');
        return false;
    }

    try {
        // Get headers from first data item
        const headers = Object.keys(data[0]);

        // Create CSV rows
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(row =>
                headers.map(header => {
                    // Handle special cases (commas, quotes in values)
                    const value = row[header];
                    if (value === null || value === undefined) return '';

                    const stringValue = String(value);
                    // Escape quotes and wrap in quotes if contains comma or quotes
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ];

        // Create CSV content
        const csvContent = csvRows.join('\n');

        // Create a download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename || 'export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
        return true;
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        return false;
    }
};

/**
 * Formats metering data specifically for export
 * @param {Array} meteringData - Array of metering data objects
 * @param {String} filename - Optional filename
 * @returns {Boolean} - Success status
 */
export const exportMeteringData = (meteringData, filename = 'metering-data.csv') => {
    if (!meteringData || meteringData.length === 0) return false;

    // Format data for export
    const formattedData = meteringData.map(item => ({
        Timestamp: new Date(item.timestamp).toLocaleString(),
        Classification: item.classification?.name || 'Unknown',
        Type: item.classification?.type || 'Unknown',
        'Energy (kWh)': item.energyValue.toFixed(2),
        'Power (kW)': item.power.toFixed(2),
        ClassificationId: item.classificationId
    }));

    return exportToCSV(formattedData, filename);
};