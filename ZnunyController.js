const { 
    generateTicket, 
    addArticleToTicket, 
    getTicketDetails, 
    getOpenTickets: fetchOpenTickets,
    validateCredentials
} = require("../models/ZnunyModel");

// Create a new session
async function createSession(req, res) {
    try {
        const { User, Password } = req.body;

        validateCredentials(User, Password);

        const session = {
            SessionID: `SESSION-${Date.now()}`,
            SessionName: "ZSOAR-SESSION",
            User
        };

        res.json(session);
    } catch (error) {
        console.error("Error in createSession:", error.message);
        res.status(401).json({ error: "Session creation failed", details: error.message });
    }
}

// Create a new ticket
async function createTicket(req, res) {
    try {
        const { User, Password, Ticket, Context } = req.body;

        validateCredentials(User, Password);

        const ticket = generateTicket(User, Password, { Ticket, Context });
        res.status(201).json(ticket);
    } catch (error) {
        console.error("Error in createTicket:", error.message);
        res.status(401).json({ error: "Ticket creation failed", details: error.message });
    }
}

// Add an article/update to an existing ticket
async function addArticle(req, res) {
    try {
        const { User, Password, Article } = req.body;

        validateCredentials(User, Password);

        const article = addArticleToTicket(User, Password, req.params.ticketNumber, { Article });
        res.status(201).json(article);
    } catch (error) {
        console.error("Error in addArticle:", error.message);
        res.status(401).json({ error: "Article addition failed", details: error.message });
    }
}

// Retrieve a ticket's details (including articles)
async function getTicket(req, res) {
    try {
        const { User, Password } = req.body;

        validateCredentials(User, Password);

        const ticket = getTicketDetails(User, Password, req.params.ticketNumber);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        res.json(ticket);
    } catch (error) {
        console.error("Error in getTicket:", error.message);
        res.status(401).json({ error: "Ticket retrieval failed", details: error.message });
    }
}

// Search for open tickets
async function ticketSearch(req, res) {
    try {
        const { User, Password, State } = req.body;

        validateCredentials(User, Password);

        const tickets = fetchOpenTickets(User, Password).filter(ticket => ticket.State === (State || "new"));
        res.json(tickets);
    } catch (error) {
        console.error("Error in ticketSearch:", error.message);
        res.status(401).json({ error: "Failed to search tickets", details: error.message });
    }
}

// Add detection context to a ticket
async function addDetectionContext(req, res) {
    try {
        const { User, Password, Context } = req.body;

        validateCredentials(User, Password);

        const ticketNumber = req.params.ticketNumber;
        const contextArticle = {
            Article: {
                Subject: "Detection Context Update",
                Body: JSON.stringify(Context, null, 2)
            }
        };

        const article = addArticleToTicket(User, Password, ticketNumber, contextArticle);
        res.status(201).json(article);
    } catch (error) {
        console.error("Error in addDetectionContext:", error.message);
        res.status(401).json({ error: "Failed to add detection context", details: error.message });
    }
}

module.exports = { 
    createSession, 
    createTicket, 
    addArticle, 
    getTicket, 
    ticketSearch,
    addDetectionContext
};