const fs = require("fs");
const path = require("path");

async function GetClientListFile() {
  try {
    const ClientListFile = path.resolve(
      __dirname,
      "..",
      "..",
      "python-scripts",
      "Responder",
      "clients.json"
    );
    const file = fs.readFileSync(ClientListFile, "utf-8");
    const data = JSON.parse(file);
    return data;
  } catch (error) {
    console.log("Error in GetClientListFile: ", error);
    return [];
  }
}

module.exports = { GetClientListFile };