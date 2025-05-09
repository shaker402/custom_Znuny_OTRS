import axios from "axios";

const sessionManager = {
    sessionID: null, // To store the session ID

    /**
     * Create a session by contacting the backend
     * @param {string} backEndURL - The backend base URL
     * @returns {Promise<void>}
     */
    async createSession(backEndURL) {
        console.log("[DEBUG] sessionManager.createSession called"); // Debugging log
        try {
            // Retrieve credentials from environment variables
            const username = process.env.REACT_APP_USERNAME;
            const password = process.env.REACT_APP_PASSWORD;

            console.log("[DEBUG] Environment variables - Username:", username, "Password:", password);

            if (!username || !password) {
                throw new Error("Missing credentials in environment variables. Ensure 'REACT_APP_USERNAME' and 'REACT_APP_PASSWORD' are set.");
            }

            // Make a POST request to create a session
            console.log("[DEBUG] Sending POST request to create session at:", `${backEndURL}/znuny/nph-genericinterface.pl/Webservice/ALERTELAST_API/Session`);
            const response = await axios.post(`${backEndURL}/znuny/nph-genericinterface.pl/Webservice/ALERTELAST_API/Session`, {
                User: username,
                Password: password,
            });

            // Save the session ID
            this.sessionID = response.data.SessionID;
            console.log("[DEBUG] Session created successfully. Session ID:", this.sessionID);
        } catch (error) {
            console.error("[ERROR] Failed to create session:", error.message);
            console.error("[DEBUG] Full error object:", error); // Log the full error object for debugging
            throw new Error("Failed to create session. Please check your credentials and backend connection.");
        }
    },

    /**
     * Get the session ID
     * @returns {string|null} - The session ID
     */
    getSessionID() {
        console.log("[DEBUG] sessionManager.getSessionID called. Current Session ID:", this.sessionID);
        return this.sessionID;
    },

    /**
     * Reset the session ID
     */
    resetSession() {
        console.log("[DEBUG] sessionManager.resetSession called. Resetting session ID.");
        this.sessionID = null;
    },
};

export default sessionManager;