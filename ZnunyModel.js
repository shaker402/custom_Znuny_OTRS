const { v4: uuid } = require("uuid");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Database pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "the1Esmarta",
    database: process.env.DB_NAME || "mssp",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper to format MySQL datetime
function mysqlDateTime(date = new Date()) {
    return date.toISOString().slice(0, 19).replace("T", " ");
}

// Validate user credentials
function validateCredentials(user, password) {
    const VALID_USER = process.env.VALID_USER || "zsoar";
    const VALID_PASSWORD = process.env.VALID_PASSWORD || "the1Esmarta";

    if (user !== VALID_USER || password !== VALID_PASSWORD) {
        throw new Error("Invalid credentials");
    }
}

// Create a session in the database
async function createSessionInDB(sessionID, user) {
    const connection = await pool.getConnection();
    try {
        await connection.query(
            "INSERT INTO sessions (SessionID, User, Created) VALUES (?, ?, ?)",
            [sessionID, user, mysqlDateTime()]
        );
    } finally {
        connection.release();
    }
}

// Check if a session is valid
async function isValidSessionInDB(sessionKey) {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            "SELECT SessionID FROM sessions WHERE SessionID = ?",
            [sessionKey]
        );
        return rows.length > 0;
    } finally {
        connection.release();
    }
}

// Generate a new ticket
async function generateTicket(ticketData) {
    const connection = await pool.getConnection();
    try {
        const ticketID = uuid();
        const ticketNumber = `MOCK-${Date.now()}`;
        const created = mysqlDateTime();

        await connection.query(
            `INSERT INTO tickets (TicketNumber, TicketID, Title, Queue, Priority, Type, State, CustomerUser, Created, Updated, DynamicFields, Notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ticketNumber,
                ticketID,
                ticketData.Title,
                ticketData.Queue,
                ticketData.Priority,
                ticketData.Type,
                ticketData.State,
                ticketData.CustomerUser,
                created,
                created,
                JSON.stringify(ticketData.DynamicFields || {}),
                JSON.stringify([])
            ]
        );

        return {
            TicketID: ticketID,
            TicketNumber: ticketNumber
        };
    } finally {
        connection.release();
    }
}

// Add an article to a ticket
async function addArticleToTicket(ticketNumber, articleData) {
    const connection = await pool.getConnection();
    try {
        const articleID = uuid();
        const created = mysqlDateTime();

        await connection.query(
            `INSERT INTO articles (ArticleID, TicketNumber, Subject, Body, MimeType, Created) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [articleID, ticketNumber, articleData.Subject, articleData.Body, articleData.MimeType, created]
        );

        return {
            ArticleID: articleID,
            Subject: articleData.Subject,
            Body: articleData.Body,
            Created: created
        };
    } finally {
        connection.release();
    }
}

// Retrieve ticket details
async function getTicketDetails(ticketNumber) {
    const connection = await pool.getConnection();
    try {
        const [ticketRows] = await connection.query(
            `SELECT * FROM tickets WHERE TicketNumber = ?`,
            [ticketNumber]
        );

        if (ticketRows.length === 0) {
            return null;
        }

        const ticket = ticketRows[0];

        const [articleRows] = await connection.query(
            `SELECT * FROM articles WHERE TicketNumber = ?`,
            [ticketNumber]
        );

        return {
            TicketID: ticket.TicketID,
            Title: ticket.Title,
            Queue: ticket.Queue,
            Priority: ticket.Priority,
            State: ticket.State,
            CustomerUser: ticket.CustomerUser,
            DynamicFields: JSON.parse(ticket.DynamicFields || "{}"),
            Articles: articleRows.map(article => ({
                ArticleID: article.ArticleID,
                Subject: article.Subject,
                Body: article.Body,
                Created: article.Created
            }))
        };
    } finally {
        connection.release();
    }
}

// Search tickets in the database
async function searchTicketsInDB(filters) {
    const connection = await pool.getConnection();
    try {
        let query = `SELECT * FROM tickets WHERE 1=1`;
        const params = [];

        if (filters.TicketNumber) {
            query += ` AND TicketNumber = ?`;
            params.push(filters.TicketNumber);
        }

        const [rows] = await connection.query(query, params);
        return rows;
    } finally {
        connection.release();
    }
}

// Add context to a ticket
async function addContextToTicket(ticketNumber, contextData) {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            `SELECT DynamicFields FROM tickets WHERE TicketNumber = ?`,
            [ticketNumber]
        );

        if (rows.length === 0) {
            throw new Error(`Ticket with TicketNumber ${ticketNumber} does not exist.`);
        }

        const dynamicFields = JSON.parse(rows[0].DynamicFields || "{}");
        const updatedFields = { ...dynamicFields, ...contextData };

        await connection.query(
            `UPDATE tickets SET DynamicFields = ?, Updated = ? WHERE TicketNumber = ?`,
            [JSON.stringify(updatedFields), mysqlDateTime(), ticketNumber]
        );

        return updatedFields;
    } finally {
        connection.release();
    }
}

module.exports = {
    validateCredentials,
    createSessionInDB,
    isValidSessionInDB,
    generateTicket,
    addArticleToTicket,
    getTicketDetails,
    searchTicketsInDB,
    addContextToTicket
};
