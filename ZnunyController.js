const {
    generateTicket,
    addArticleToTicket,
    getTicketDetails,
    validateCredentials,
    addContextToTicket,
    createSessionInDB,
    isValidSessionInDB,
    searchTicketsInDB
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

        await createSessionInDB(session.SessionID, User);

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

        const ticket = await generateTicket({
            Title,
            Queue,
            Priority,
            Type,
            State,
            CustomerUser,
            DynamicFields: Ticket.DynamicFields || {}
        });

        const article = {
            ArticleID: "9",
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

        const article = await addArticleToTicket(ticketNumber, {
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

        if (!sessionKey || !(await isValidSessionInDB(sessionKey))) {
            throw new Error("Invalid or missing session key");
        }

        const ticket = await getTicketDetails(ticketNumber);

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        res.status(200).json({ Ticket: [ticket] });
    } catch (error) {
        console.error("Error in getTicket:", error.message);
        res.status(400).json({ error: "Ticket retrieval failed", details: error.message });
    }
}

// Search for tickets
async function ticketSearch(req, res) {
    try {
        const sessionKey = req.headers.sessionid || req.body.SessionID || req.query.SessionID;

        if (!sessionKey || !(await isValidSessionInDB(sessionKey))) {
            throw new Error("Invalid or missing session key");
        }

        const { TicketNumber } = req.query;
        const tickets = await searchTicketsInDB({ TicketNumber });

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

        const updatedTicket = await addContextToTicket(ticketNumber, Context);

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
