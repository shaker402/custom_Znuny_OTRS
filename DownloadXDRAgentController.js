const fs = require("fs");
const path = require("path");

async function downloadXDRAgent(req, res) {
  const { PathOs } = req.body;
  const basePath = "/home/tenroot/setup_platform/workdir/agent_scripts";
  
  // Add debug logs
  console.log("Received download request for:", PathOs);
  console.log("Base path:", basePath);

  try {
    // Validate input
    if (!PathOs || typeof PathOs !== "string") {
      console.error("Invalid PathOs parameter");
      return res.status(400).json({ error: "Invalid file path" });
    }

    // Construct safe path
    const requestedFile = path.join(basePath, PathOs);
    console.log("Resolved path:", requestedFile);

    // Verify path containment
    if (!requestedFile.startsWith(basePath)) {
      console.error("Path traversal attempt detected");
      return res.status(400).json({ error: "Invalid path" });
    }

    // Check file existence
    if (!fs.existsSync(requestedFile)) {
      console.error("File not found:", requestedFile);
      return res.status(404).json({ error: "File not found" });
    }

    // Verify file type
    const stats = fs.statSync(requestedFile);
    if (!stats.isFile()) {
      console.error("Path is not a file:", requestedFile);
      return res.status(400).json({ error: "Invalid file type" });
    }

    console.log("Serving file:", requestedFile);
    res.download(requestedFile, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Download failed" });
        }
      }
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { downloadXDRAgent };