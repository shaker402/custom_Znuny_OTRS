const { v4: uuid } = require("uuid");

// Load sensitive information from environment variables
const VALID_USER = process.env.VALID_USER || "zsoar";
const VALID_PASSWORD = process.env.VALID_PASSWORD || "the1Esmarta";

// Mock storage
const mockTickets = new Map();
const mockArticles = new Map();

/**
 * Validate user credentials
 * @param {string} user - Username
 * @param {string} password - Password
 * @throws {Error} If credentials are invalid
 */
function validateCredentials(user, password) {
    if (user !== VALID_USER || password !== VALID_PASSWORD) {
        throw new Error("Invalid credentials");
    }
}

/**
 * Generate a new detection-ready ticket
 * @param {string} user - Username
 * @param {string} password - Password
 * @param {Object} ticketData - Data for the new ticket
 * @returns {Object} The newly created ticket
 */
function generateTicket(user, password, ticketData) {
    validateCredentials(user, password);

    const newTicket = {
        TicketID: uuid(),
        TicketNumber: `MOCK-${Date.now()}`,
        Title: ticketData?.Ticket?.Title || "[ZSOAR] Security Alert",
        Queue: ticketData?.Ticket?.Queue || "Security Alerts",
        Priority: ticketData?.Ticket?.Priority || "3 normal",
        Type: ticketData?.Ticket?.Type || "Detection",
        State: "new",
        Created: new Date().toISOString(),
        Context: {
            source_ip: ticketData?.Context?.source_ip || "192.168.1.100",
            process_name: ticketData?.Context?.process_name || "malware.exe",
            process_id: uuid(), // Unique process ID
            process_path: `/mock/path/${ticketData?.Context?.process_name || "malware.exe"}`,
            log_data: JSON.stringify(ticketData?.Context?.log_data || {
                event_type: "security_alert",
                severity: "high"
            })
        },
        DetectionDetails: ticketData?.DetectionDetails || []
    };

    mockTickets.set(newTicket.TicketNumber, newTicket);
    return newTicket;
}

/**
 * Retrieve all open tickets
 * @param {string} user - Username
 * @param {string} password - Password
 * @returns {Array} List of open tickets
 */
function getOpenTickets(user, password) {
    validateCredentials(user, password);

    return Array.from(mockTickets.values()).filter(ticket => ticket.State === "new");
}

/**
 * Add an article or an update to an existing ticket
 * @param {string} user - Username
 * @param {string} password - Password
 * @param {string} ticketNumber - Ticket number for the update
 * @param {Object} articleData - Data for the article
 * @returns {Object} The newly added article
 * @throws {Error} If the ticket does not exist
 */
function addArticleToTicket(user, password, ticketNumber, articleData) {
    validateCredentials(user, password);

    const newArticle = {
        ArticleID: uuid(),
        Subject: articleData?.Article?.Subject || "ZSOAR Context Update",
        Body: articleData?.Article?.Body || "{}",
        ContentType: "text/html",
        TicketNumber: ticketNumber,
        Created: new Date().toISOString()
    };

    if (!mockTickets.has(ticketNumber)) {
        throw new Error(`Ticket with TicketNumber ${ticketNumber} does not exist.`);
    }

    if (!mockArticles.has(ticketNumber)) {
        mockArticles.set(ticketNumber, []);
    }
    mockArticles.get(ticketNumber).push(newArticle);

    return newArticle;
}

/**
 * Retrieve full details of a specific ticket
 * @param {string} user - Username
 * @param {string} password - Password
 * @param {string} ticketNumber - Ticket number to retrieve
 * @returns {Object|null} The ticket details including articles
 */
function getTicketDetails(user, password, ticketNumber) {
    validateCredentials(user, password);

    const ticket = mockTickets.get(ticketNumber);
    if (!ticket) return null;

    return {
        ...ticket,
        Articles: mockArticles.get(ticketNumber) || []
    };
}

/**
 * Add context data to an existing ticket
 * @param {string} user - Username
 * @param {string} password - Password
 * @param {string} ticketNumber - Ticket number to update
 * @param {Object} contextData - Additional context data to add
 * @returns {Object} The updated ticket
 * @throws {Error} If the ticket does not exist
 */
function addContextToTicket(user, password, ticketNumber, contextData) {
    validateCredentials(user, password);

    if (!mockTickets.has(ticketNumber)) {
        throw new Error(`Ticket with TicketNumber ${ticketNumber} does not exist.`);
    }

    const ticket = mockTickets.get(ticketNumber);
    ticket.Context = { ...ticket.Context, ...contextData };

    return ticket;
}

module.exports = {
    generateTicket,
    getOpenTickets,
    addArticleToTicket,
    getTicketDetails,
    validateCredentials,
    addContextToTicket
};