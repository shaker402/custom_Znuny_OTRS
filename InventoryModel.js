const fs = require("fs");
const path = require("path");
const DBConnection = require("../db.js");

async function GetInventoryFile() {
  try {
    const InventoryFile = await path.resolve(
      __dirname,
      "..",
      "..",
      "python-scripts",
      "response_folder",
      "vulnerability_inventory.json"
    );
    const file = await fs.readFileSync(InventoryFile, "utf-8");
    const data = JSON.parse(file);
    return data;
  } catch (error) {
    console.log("Error in GetInventoryFile: ", error);
    return {};
  }
}

async function UpdateInventoryFile() {
  try {
    const InventoryFile = await path.resolve(
      __dirname,
      "..",
      "..",
      "python-scripts",
      "response_folder",
      "vulnerability_inventory.json"
    );
    const file = await fs.readFileSync(InventoryFile, "utf-8");
    const data = JSON.parse(file);

    // Update the database with the new inventory data
    const connection = await DBConnection();
    await connection.query("DELETE FROM inventory");
    const insertQuery = "INSERT INTO inventory (type, name) VALUES ?";
    const values = data.map(item => [item.type, item.name]);
    await connection.query(insertQuery, [values]);
    await connection.end();

    return true;
  } catch (error) {
    console.log("Error in UpdateInventoryFile: ", error);
    return false;
  }
}

async function FilterInventoryFile(filter, name) {
  try {
    const InventoryFile = await path.resolve(
      __dirname,
      "..",
      "..",
      "python-scripts",
      "response_folder",
      `${filter}_inventory_${name}.json`
    );
    const file = await fs.readFileSync(InventoryFile, "utf-8");
    const data = JSON.parse(file);
    return data;
  } catch (error) {
    console.log("Error in FilterInventoryFile: ", error);
    return {};
  }
}

module.exports = { GetInventoryFile, UpdateInventoryFile, FilterInventoryFile };