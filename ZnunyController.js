const {
    generateTicket,
    addArticleToTicket,
    getTicketDetails,
    getOpenTickets,
    validateCredentials,
    addContextToTicket,
    createMockSession,
    isValidSession,
    mockTickets,
    mockArticles
} = require("../models/ZnunyModel");

// Create a new session
async function createSession(req, res) {
    try {
        const User = req.body.User || req.body.UserLogin;
        const { Password } = req.body;

        if (!User || !Password) {
            throw new Error("Missing required fields: User or Password");
        }

        validateCredentials(User, Password);

        const session = {
            SessionID: `SESSION-${Date.now()}`,
            SessionName: "ZSOAR-SESSION",
            User
        };

        createMockSession(session.SessionID);

        res.status(200).json(session);
    } catch (error) {
        console.error("Error in createSession:", error.message);
        res.status(401).json({ error: "Session creation failed", details: error.message });
    }
}

// Create a new ticket
async function createTicket(req, res) {
    try {
        const { Ticket, Article, SessionID } = req.body;

        if (!Ticket) {
            throw new Error("Missing Ticket object in payload");
        }

        const { Title, Queue, Priority, Type, State, CustomerUser } = Ticket;

        if (!Title || !Queue || !Priority || !Type || !State || !CustomerUser) {
            throw new Error("Missing required fields for ticket creation");
        }

        const ticket = generateTicket({
            Title,
            Queue,
            Priority,
            Type,
            State,
            CustomerUser,
            DynamicFields: Ticket.DynamicFields || {}
        });

        const article = {
            ArticleID: 9, // Example ArticleID as an integer
            Subject: Article?.Subject || "Default Subject",
            Body: Article?.Body || "Default Body",
            MimeType: Article?.MimeType || "text/plain"
        };

        res.status(201).json({
            TicketID: ticket.TicketID,
            TicketNumber: ticket.TicketNumber,
            ArticleID: article.ArticleID
        });
    } catch (error) {
        console.error("Error in createTicket:", error.message);
        res.status(400).json({ error: "Ticket creation failed", details: error.message });
    }
}

// Add an article to an existing ticket
async function addArticle(req, res) {
    try {
        const { User, Password, Article } = req.body;
        const { ticketNumber } = req.params;

        validateCredentials(User, Password);

        const article = addArticleToTicket(ticketNumber, {
            Subject: Article.Subject,
            Body: Article.Body,
            MimeType: Article.MimeType || "text/plain"
        });

        res.status(201).json({
            Article: {
                ArticleID: article.ArticleID,
                Subject: article.Subject,
                Body: article.Body,
                Created: article.Created
            }
        });
    } catch (error) {
        console.error("Error in addArticle:", error.message);
        res.status(400).json({ error: "Article creation failed", details: error.message });
    }
}

// Retrieve a ticket's details
async function getTicket(req, res) {
    try {
        const { ticketNumber } = req.params;
        const sessionKey = req.headers.sessionid || req.body.SessionID || req.query.SessionID;

        if (!sessionKey || !isValidSession(sessionKey)) {
            throw new Error("Invalid or missing session key");
        }

        const ticket = mockTickets.get(parseInt(ticketNumber, 10)); // Ensure ticketNumber is treated as an integer

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        const articles = mockArticles.get(ticket.TicketNumber) || [];

        const ticketResponse = [
            {
                TicketID: ticket.TicketID,
                Title: ticket.Title,
                Queue: ticket.Queue,
                Priority: ticket.Priority,
                State: ticket.State,
                CustomerUser: ticket.CustomerUser,
                DynamicFields: ticket.DynamicFields || [],
                Articles: articles.map(article => ({
                    ArticleID: article.ArticleID,
                    Subject: article.Subject,
                    Body: article.Body,
                    Created: article.Created
                }))
            }
        ];

        res.status(200).json({ Ticket: ticketResponse });
    } catch (error) {
        console.error("Error in getTicket:", error.message);
        res.status(400).json({ error: "Ticket retrieval failed", details: error.message });
    }
}

// Search for tickets
async function ticketSearch(req, res) {
    try {
        const sessionKey = req.headers.sessionid || req.body.SessionID || req.query.SessionID;

        if (!sessionKey || !isValidSession(sessionKey)) {
            throw new Error("Invalid or missing session key");
        }

        const { TicketNumber } = req.query;

        let tickets = Array.from(mockTickets.values());

        if (TicketNumber) {
            tickets = tickets.filter(ticket => ticket.TicketNumber === TicketNumber);
        }

        const ticketIDs = tickets.map(ticket => ticket.TicketID);
        res.status(200).json({ TicketID: ticketIDs });
    } catch (error) {
        console.error("Error in ticketSearch:", error.message);
        res.status(400).json({ error: "Ticket search failed", details: error.message });
    }
}

// Add context to a ticket
async function addDetectionContext(req, res) {
    try {
        const { User, Password, Context } = req.body;
        const { ticketNumber } = req.params;

        validateCredentials(User, Password);

        const updatedTicket = addContextToTicket(ticketNumber, Context);

        res.status(201).json({ Ticket: updatedTicket });
    } catch (error) {
        console.error("Error in addDetectionContext:", error.message);
        res.status(400).json({ error: "Failed to add detection context", details: error.message });
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
