const {
    generateTicket,
    validateCredentials,
    createMockSession,
    isValidSession  ,
    addArticleToTicketWithoutValidation,
    mockTickets ,// Import mockTickets
    mockArticles, // Import mockArticles
	pool,

} = require("../models/ZnunyModel");

// Create a new session

// Create a new session
async function createSession(req, res) {
    try {
        const User = req.body.User || req.body.UserLogin;
        const { Password } = req.body;
		console.log(`[DEBUG] test Success Response sent from frontend  `);


        if (!User || !Password) {
            throw new Error("Missing required fields: User or Password");
        }

        // Validate user credentials
        validateCredentials(User, Password);

        // Create a new session
        const session = {
            SessionID: `SESSION-${Date.now()}`,
            SessionName: "ZSOAR-SESSION",
            User,
        };

        // Store the session in the database
        await createMockSession(session.SessionID);

        // Respond with the session details
        res.status(200).json(session); // Use HTTP 200 for session creation
    } catch (error) {
        console.error("Error in createSession:", error.message);
        res.status(401).json({ error: "Session creation failed", details: error.message });
    }
}
// Create a new ticket
// Create a new ticket
// Create a new ticket
async function createTicket(req, res) {
    try {
        
		    console.log('[DEBUG] createTicket body:', req.body);
	console.log('[DEBUG] createTicket headers:', req.headers);
		console.log('[DEBUG] createTicket query:', req.query);
		
		const { Ticket, Article, SessionID } = req.body;
;
	
	
	if (!Ticket) {
            throw new Error("Missing Ticket object in payload");
        }

        const { Title, Queue, Priority, Type, State, CustomerUser } = Ticket;

        if (!Title || !Queue || !Priority || !Type || !State || !CustomerUser) {
            throw new Error("Missing required fields for ticket creation");
        }

        // Generate the ticket
        const ticket = await generateTicket(
            {
                Title,
                Queue,
                Priority,
                Type,
                State,
                CustomerUser,
                DynamicFields: Ticket.DynamicFields || []
            },
            Article // Pass the Article data to be saved
        );

        // If an article is provided, validate and add it
        let addedArticle = null;
        if (Article) {
            const validatedArticle = validateArticleData(Article);
            addedArticle = await addArticleToTicketWithoutValidation(ticket.TicketNumber, validatedArticle);
        }

        // Return response in the correct format
        res.status(201).json({
            TicketID: ticket.TicketID,
            TicketNumber: ticket.TicketNumber,
            ArticleID: addedArticle ? addedArticle.ArticleID : null,
        });
    } catch (error) {
        console.error("Error in createTicket:", error.message);
        res.status(400).json({ error: "Ticket creation failed", details: error.message });
    }
}





// Retrieve a ticket's details
// Retrieve a ticket's details
// Retrieve a single ticket (session optional)
async function getTicket(req, res) {
    try {
        const { ticketNumber } = req.params;
        const sessionKey = req.headers.sessionid || req.body.SessionID || req.query.SessionID;
        console.log(`[DEBUG] Incoming getTicket request for ${ticketNumber}, sessionKey=${sessionKey || 'none'}`);

        // If a session key was provided, validate it
        if (sessionKey) {
            if (!(await isValidSession(sessionKey))) {
                throw new Error("Invalid session key");
            }
        }

        // Normalize the ticket number
        const normalizedTicketNumber = ticketNumber.startsWith("MOCK-")
            ? ticketNumber
            : `MOCK-${ticketNumber}`;

        const connection = await pool.getConnection();
        try {
            // Fetch ticket
            const [ticketRows] = await connection.query(
                `SELECT * FROM tickets WHERE TicketNumber = ?`,
                [normalizedTicketNumber]
            );
            if (ticketRows.length === 0) {
                return res.status(404).json({ error: "Ticket not found" });
            }

            const ticket = ticketRows[0];

            // Safely parse JSON fields
            try {
                ticket.DynamicFields = ticket.DynamicFields
                    ? JSON.parse(ticket.DynamicFields)
                    : [];
            } catch {
                console.warn(`[WARN] Malformed DynamicFields for ${normalizedTicketNumber}`);
                ticket.DynamicFields = [];
            }
            try {
                ticket.Notes = ticket.Notes ? JSON.parse(ticket.Notes) : [];
            } catch {
                console.warn(`[WARN] Malformed Notes for ${normalizedTicketNumber}`);
                ticket.Notes = [];
            }

            // Fetch related articles
            const [articleRows] = await connection.query(
                `SELECT * FROM articles WHERE TicketNumber = ?`,
                [normalizedTicketNumber]
            );

            // Build response
            const response = {
                Ticket: [
                    {
                        TicketID: ticket.TicketID,
                        TicketNumber: ticket.TicketNumber,
                        Title: ticket.Title,
                        Queue: ticket.Queue,
                        Priority: ticket.Priority,
                        State: ticket.State,
                        CustomerUser: ticket.CustomerUser,
                        Articles: articleRows.map(a => ({
                            ArticleID: a.ArticleID,
                            Subject: a.Subject,
                            Body: a.Body,
                            MimeType: a.MimeType,
                            Created: a.Created,
                        }))
                    }
                ]
            };

          //  console.log(`[DEBUG] getTicket response: ${JSON.stringify(response, null, 2)}`);
            res.status(200).json(response);
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(`[ERROR] getTicket failed: ${error.message}`);
        res.status(400).json({ error: "Ticket retrieval failed", details: error.message });
    }
}
// Search for tickets
async function ticketSearch(req, res) {
    try {
        // Validate session key from headers, body, or query parameters
        const sessionKey = req.headers.sessionid || req.body.SessionID || req.query.SessionID;
        if (!sessionKey || !(await isValidSession(sessionKey))) {
            throw new Error("Invalid or missing session key");
        }

        // Retrieve tickets based on query parameters (e.g., TicketNumber)
        const { TicketNumber } = req.query;

        console.log(`Raw logs req.params ticketSearch for TicketNumber `, JSON.stringify(req.params, null, 2));
        console.log(`Raw logs body ticketSearch for TicketNumber`, JSON.stringify(req.body, null, 2));
        console.log(`Raw logs query ticketSearch for TicketNumber `, JSON.stringify(req.query, null, 2));

        const connection = await pool.getConnection();
        try {
            let query = `SELECT TicketID FROM tickets`;
            const queryParams = [];

            // If TicketNumber is provided, filter by it
            if (TicketNumber) {
                query += ` WHERE TicketNumber = ?`;
                queryParams.push(TicketNumber);
            }

            const [rows] = await connection.query(query, queryParams);

            // Extract TicketIDs from the result
            const ticketIDs = rows.map(row => row.TicketID);

            // Return ticket IDs in the expected format
            res.status(200).json({ TicketID: ticketIDs });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in ticketSearch:", error.message);
        res.status(400).json({ error: "Ticket search failed", details: error.message });
    }
}

// Add context to a ticket

// Add context to a ticket
async function TicketUpdate(req, res) {
    try {

        const sessionKey = req.headers.sessionid || req.body.SessionID || req.query.SessionID;
        if (!sessionKey || !(await isValidSession(sessionKey))) {
            throw new Error("Invalid or missing session key");
        }
		    console.log('[DEBUG] TicketUpdate body:', req.body);
	console.log('[DEBUG] TicketUpdate headers:', req.headers);
		console.log('[DEBUG] TicketUpdate query:', req.query);
		
        const { Ticket, Article } = req.body;
        const ticketNumberRaw = req.body.TicketNumber || req.params.ticketNumber;

        if (!ticketNumberRaw) {
            throw new Error("Missing TicketNumber");
        }

        const normalizedTicketNumber = ticketNumberRaw.startsWith("MOCK-") ? ticketNumberRaw : `MOCK-${ticketNumberRaw}`;

        const connection = await pool.getConnection();
        try {
            // Retrieve the ticket from the database
            const [ticketRows] = await connection.query(
                `SELECT * FROM tickets WHERE TicketNumber = ?`,
                [normalizedTicketNumber]
            );

            if (ticketRows.length === 0) {
                throw new Error(`Ticket with TicketNumber ${normalizedTicketNumber} not found`);
            }

            const ticket = ticketRows[0];

            // Update ticket properties if provided
            if (Ticket) {
                const updatedTicket = {
                    ...ticket,
                    ...Ticket,
                    Updated: new Date().toISOString(), // Ensure the Updated field is refreshed
                };

                // Update the ticket in the database
                await connection.query(
                    `UPDATE tickets SET Title = ?, Queue = ?, Priority = ?, Type = ?, State = ?, CustomerUser = ?, Updated = ?, DynamicFields = ? WHERE TicketNumber = ?`,
                    [
                        updatedTicket.Title,
                        updatedTicket.Queue,
                        updatedTicket.Priority,
                        updatedTicket.Type,
                        updatedTicket.State,
                        updatedTicket.CustomerUser,
                        updatedTicket.Updated,
                        updatedTicket.DynamicFields,
                        normalizedTicketNumber,
                    ]
                );
            }

            // Add a new article if provided
            let newArticle = null;
            if (Article) {
                try {
                    const validatedArticle = validateArticleData(Article);
                    validatedArticle.TicketID = ticket.TicketID; // Attach TicketID to the article object

                    newArticle = await addArticleToTicketWithoutValidation(normalizedTicketNumber, validatedArticle);
                } catch (error) {
                    console.error(`[ERROR] Failed to add article: ${error.message}`);
                }
            }

            // Construct the response
            const response = {
                TicketID: ticket.TicketID, // Ensure TicketID is included
                TicketNumber: ticket.TicketNumber,
                Article: newArticle || null, // Include the article object in the response
            };

            //console.log(`[DEBUG] Response sent from update ticket to PyOTRS: ${JSON.stringify(response, null, 2)}`);
            res.status(200).json(response);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(`[ERROR] TicketUpdate failed: ${error.message}`);
        res.status(400).json({ error: "Ticket update failed", details: error.message });
    }
}

function validateArticleData(articleData) {
    if (!articleData.Subject || !articleData.Body) {
        throw new Error("Invalid Article data. Subject and Body are required.");
    }
    return {
        Subject: articleData.Subject,
        Body: articleData.Body,
        MimeType: articleData.MimeType || "text/plain",
        Charset: articleData.Charset || "UTF8"
    };
}

// Retrieve all tickets (no session validation)
async function getAllTickets(req, res) {
    try {
        const connection = await pool.getConnection();
        console.log(`[DEBUG] test rout Response sent from frontend Ticket`);

        try {
            // Retrieve all tickets from the database
            const [ticketRows] = await connection.query(`SELECT * FROM tickets`);

            if (ticketRows.length === 0) {
                return res.status(404).json({ error: "No tickets found" });
            }

            // Format the response
            const tickets = await Promise.all(
                ticketRows.map(async (ticket) => {
                    // Safely parse JSON fields
                    try {
                        ticket.DynamicFields = ticket.DynamicFields ? JSON.parse(ticket.DynamicFields) : [];
                    } catch (parseError) {
                       // console.warn(`[WARN] Failed to parse DynamicFields for TicketNumber=${ticket.TicketNumber}`);
                        ticket.DynamicFields = [];
                    }

                    try {
                        ticket.Notes = ticket.Notes ? JSON.parse(ticket.Notes) : [];
                    } catch (parseError) {
                        //console.warn(`[WARN] Failed to parse Notes for TicketNumber=${ticket.TicketNumber}`);
                        ticket.Notes = [];
                    }

                    // Retrieve associated articles
                    const [articleRows] = await connection.query(
                        `SELECT * FROM articles WHERE TicketNumber = ?`,
                        [ticket.TicketNumber]
                    );

                    return {
                        TicketID: ticket.TicketID,
                        TicketNumber: ticket.TicketNumber,
                        Title: ticket.Title,
                        Queue: ticket.Queue,
                        Priority: ticket.Priority,
                        State: ticket.State,
                        CustomerUser: ticket.CustomerUser,
                        Created: ticket.Created,
                        Updated: ticket.Updated,
                        DynamicFields: ticket.DynamicFields,
                        Notes: ticket.Notes,
                        Articles: articleRows.map((article) => ({
                            ArticleID: article.ArticleID,
                            Subject: article.Subject,
                            Body: article.Body,
                            MimeType: article.MimeType,
                            Created: article.Created,
                        })),
                    };
                })
            );

          //  console.log(`[DEBUG] Retrieved all tickets: ${JSON.stringify(tickets, null, 2)}`);
            res.status(200).json(tickets);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(`[ERROR] Failed to retrieve all tickets: ${error.message}`);
        res.status(400).json({ error: "Failed to retrieve tickets", details: error.message });
    }
}

// Export the functions for use in routes 

module.exports = {
    createSession,
    createTicket,
    getTicket,
    ticketSearch,
    TicketUpdate,
    getAllTickets,
};


