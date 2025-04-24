const { GetInventoryFile, UpdateInventoryFile, FilterInventoryFile } = require("../models/InventoryModel");
const { exec } = require("child_process");

async function GetInventoryData(req, res, next) {
  try {
    const data = await GetInventoryFile();
    res.send(data);
  } catch (error) {
    console.log(error, "GetInventoryData Error");
    res.status(500).send({ msg: "Error fetching inventory data", error });
  }
}

async function UpdateInventoryData(req, res, next) {
  try {
    exec("python3 /home/tenroot/my-project/python-scripts/vulnerability_export.py", async (error, stdout, stderr) => {
      if (error) {
        console.log(`Error executing vulnerability_export.py: ${error.message}`);
        return res.status(500).send({ msg: "Error updating inventory data", error: error.message });
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return res.status(500).send({ msg: "Error updating inventory data", error: stderr });
      }
      console.log(`stdout: ${stdout}`);
      await UpdateInventoryFile();
      res.send({ msg: "Inventory data updated successfully" });
    });
  } catch (error) {
    console.log(error, "UpdateInventoryData Error");
    res.status(500).send({ msg: "Error updating inventory data", error });
  }
}

async function FilterInventoryData(req, res, next) {
  try {
    const { filter, name } = req.body;
    exec(`python3 /home/tenroot/my-project/python-scripts/json_inventory.py --filter ${filter} --name ${name}`, async (error, stdout, stderr) => {
      if (error) {
        console.log(`Error executing json_inventory.py: ${error.message}`);
        return res.status(500).send({ msg: "Error filtering inventory data", error: error.message });
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return res.status(500).send({ msg: "Error filtering inventory data", error: stderr });
      }
      console.log(`stdout: ${stdout}`);
      const data = await FilterInventoryFile(filter, name);
      res.send(data);
    });
  } catch (error) {
    console.log(error, "FilterInventoryData Error");
    res.status(500).send({ msg: "Error filtering inventory data", error });
  }
}

module.exports = { GetInventoryData, UpdateInventoryData, FilterInventoryData };