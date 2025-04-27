const { v4: uuid } = require("uuid");

// Mock session storage
const mockSessions = new Set();

// Mock storage for tickets and articles
const mockTickets = new Map();
const mockArticles = new Map();

// Validate user credentials
function validateCredentials(user, password) {
    const VALID_USER = process.env.VALID_USER || "zsoar";
    const VALID_PASSWORD = process.env.VALID_PASSWORD || "the1Esmarta";

    if (user !== VALID_USER || password !== VALID_PASSWORD) {
        throw new Error("Invalid credentials");
    }
}

// Create a session
function createMockSession(sessionKey) {
    mockSessions.add(sessionKey);
}

// Check if a session is valid
function isValidSession(sessionKey) {
    return mockSessions.has(sessionKey);
}

// Generate a new ticket
function generateTicket(ticketData) {
    const ticket = {
        TicketID: uuid(),
        TicketNumber: `MOCK-${Date.now()}`,
        Title: ticketData.Title,
        Queue: ticketData.Queue,
        Priority: ticketData.Priority,
        Type: ticketData.Type,
        State: ticketData.State,
        CustomerUser: ticketData.CustomerUser,
        DynamicFields: ticketData.DynamicFields || {},
        Created: new Date().toISOString(),
        Updated: new Date().toISOString()
    };

    mockTickets.set(ticket.TicketNumber, ticket);
    return ticket;
}

// Add an article to a ticket
function addArticleToTicket(ticketNumber, articleData) {
    const ticket = mockTickets.get(ticketNumber);

    if (!ticket) {
        throw new Error(`Ticket with TicketNumber ${ticketNumber} does not exist.`);
    }

    const article = {
        ArticleID: uuid(),
        Subject: articleData.Subject,
        Body: articleData.Body,
        Created: new Date().toISOString()
    };

    if (!mockArticles.has(ticketNumber)) {
        mockArticles.set(ticketNumber, []);
    }

    mockArticles.get(ticketNumber).push(article);
    ticket.Updated = new Date().toISOString();

    return article;
}

// Add context to a ticket
function addContextToTicket(ticketNumber, contextData) {
    const ticket = mockTickets.get(ticketNumber);

    if (!ticket) {
        throw new Error(`Ticket with TicketNumber ${ticketNumber} does not exist.`);
    }

    ticket.DynamicFields = { ...ticket.DynamicFields, ...contextData };
    ticket.Updated = new Date().toISOString();

    return ticket;
}

module.exports = {
    validateCredentials,
    createMockSession,
    isValidSession,
    generateTicket,
    addArticleToTicket,
    addContextToTicket,
    mockTickets,
    mockArticles
};
