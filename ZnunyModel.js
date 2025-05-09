const { v4: uuid } = require("uuid");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "the1Esmarta",
  database: process.env.DB_NAME || "mssp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Environment variables for authentication
const VALID_USER = process.env.VALID_USER || "zsoar";
const VALID_PASSWORD = process.env.VALID_PASSWORD || "the1Esmarta";

// Helper function for MySQL-compatible datetime
function mysqlDateTime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// Initialize database tables
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        SessionID VARCHAR(255) PRIMARY KEY,
        User VARCHAR(255) NOT NULL,
        Created DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        TicketNumber VARCHAR(255) PRIMARY KEY,
        TicketID VARCHAR(255) NOT NULL UNIQUE,
        Title VARCHAR(255) NOT NULL,
        Queue VARCHAR(255) NOT NULL,
        Priority VARCHAR(255) NOT NULL,
        Type VARCHAR(255) NOT NULL,
        State VARCHAR(255) NOT NULL,
        CustomerUser VARCHAR(255) NOT NULL,
        Created DATETIME NOT NULL,
        Updated DATETIME NOT NULL,
        DynamicFields JSON,
        Notes JSON
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS articles (
        ArticleID VARCHAR(255) PRIMARY KEY,
        TicketNumber VARCHAR(255) NOT NULL,
        Subject TEXT NOT NULL,
        Body TEXT NOT NULL,
        MimeType VARCHAR(255) NOT NULL DEFAULT 'text/plain',
        Created DATETIME NOT NULL,
        FOREIGN KEY (TicketNumber) REFERENCES tickets(TicketNumber)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        LogID INT AUTO_INCREMENT PRIMARY KEY,
        Action VARCHAR(255) NOT NULL,
        TicketID VARCHAR(255),
        Details JSON,
        Timestamp DATETIME NOT NULL,
        Playbook VARCHAR(255),
        Stage INT,
        Success BOOLEAN
      )
    `);
  } finally {
    connection.release();
  }
}

// Validate user credentials
function validateCredentials(user, password) {
  if (user !== VALID_USER || password !== VALID_PASSWORD) {
    throw new Error("Invalid credentials");
  }
}

// Create a new session
async function createMockSession(sessionKey) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `INSERT INTO sessions (SessionID, User, Created) VALUES (?, ?, ?)`,
      [sessionKey, VALID_USER, mysqlDateTime()]
    );
  } finally {
    connection.release();
  }
}

// Check if a session is valid
async function isValidSession(sessionKey) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT 1 FROM sessions WHERE SessionID = ?`,
      [sessionKey]
    );
    return rows.length > 0;
  } finally {
    connection.release();
  }
}

// Generate a new ticket
async function generateTicket(ticketData, articleData = null) {
  const connection = await pool.getConnection();
  try {
    const newTicket = {
	  TicketID: Date.now().toString(),
      TicketNumber: `MOCK-${Date.now()}`,
      Title: ticketData.Title,
      Queue: ticketData.Queue,
      Priority: ticketData.Priority,
      Type: ticketData.Type,
      State: ticketData.State,
      CustomerUser: ticketData.CustomerUser,
      Created: mysqlDateTime(),
      Updated: mysqlDateTime(),
      DynamicFields: JSON.stringify(ticketData.DynamicFields || {}),
      Notes: JSON.stringify([]),
    };

    // Insert the ticket into the database
    await connection.query(
      `INSERT INTO tickets (TicketNumber, TicketID, Title, Queue, Priority, Type, State, CustomerUser, Created, Updated, DynamicFields, Notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTicket.TicketNumber,
        newTicket.TicketID,
        newTicket.Title,
        newTicket.Queue,
        newTicket.Priority,
        newTicket.Type,
        newTicket.State,
        newTicket.CustomerUser,
        newTicket.Created,
        newTicket.Updated,
        newTicket.DynamicFields,
        newTicket.Notes,
      ]
    );

    // If an article is provided, add it to the ticket
  

    return newTicket;
  } finally {
    connection.release();
  }
}

// Add an article to a ticket without validation
async function addArticleToTicketWithoutValidation(ticketNumber, articleData) {
  const connection = await pool.getConnection();
  try {
    const [ticketRows] = await connection.query(
      `SELECT 1 FROM tickets WHERE TicketNumber = ?`,
      [ticketNumber]
    );

    if (ticketRows.length === 0) {
      throw new Error(`Ticket with TicketNumber ${ticketNumber} does not exist.`);
    }

    const newArticle = {
      ArticleID: uuid(),
      Subject: articleData.Subject,
      Body: articleData.Body,
      MimeType: articleData.MimeType || "text/plain",
      Created: mysqlDateTime(),
    };

    await connection.query(
      `INSERT INTO articles (ArticleID, TicketNumber, Subject, Body, MimeType, Created)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newArticle.ArticleID,
        ticketNumber,
        newArticle.Subject,
        newArticle.Body,
        newArticle.MimeType,
        newArticle.Created,
      ]
    );

    // Update ticket's "Updated" field
    await connection.query(
      `UPDATE tickets SET Updated = ? WHERE TicketNumber = ?`,
      [mysqlDateTime(), ticketNumber]
    );

    //console.log(
    //  `[DEBUG] Article added: ${JSON.stringify(newArticle, null, 2)} for TicketNumber=${ticketNumber}`
   // );
    return newArticle;
  } finally {
    connection.release();
  }
}

// Export functions for compatibility
module.exports = {
  validateCredentials,
  createMockSession,
  isValidSession,
  generateTicket,
  addArticleToTicketWithoutValidation,
  mockTickets: null, // Placeholder for compatibility
  mockArticles: null, // Placeholder for compatibility
  pool,
};

// Initialize database tables on startup
initializeDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
});