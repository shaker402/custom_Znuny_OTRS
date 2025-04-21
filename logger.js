const fs = require('fs');
const path = require('path');

// Define your log file path
const logFilePath = path.join(__dirname, 'msspBack.log');

// Function to get the current timestamp
const getTimestamp = () => {
    const now = new Date();
    return `${now.toISOString()}`;
};

// Log message function
const logMessage = (level, message) => {
    const timestamp = getTimestamp();
    const logEntry = `${timestamp} ${level.toUpperCase()}: ${message}\n`;

    // Print to console
    // console.log(logEntry.trim());

    // Append to log file
    fs.appendFileSync(logFilePath, logEntry);
};

// Logger methods
const logger = {
    info: (message) => logMessage('info', message),
    error: (message) => logMessage('error', message),
    // Add more levels if needed

    // New method to log incoming requests
    request: (req) => {
        const { method, url, headers } = req;
        logMessage('info', `Incoming ${method} request to ${url} | Headers: ${JSON.stringify(headers)}`);
    },
};

module.exports = logger;
