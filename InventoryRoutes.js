const { GetInventoryData, UpdateInventoryData, FilterInventoryData } = require("../controllers/InventoryController");

const router = require("express").Router();

router.get("/GetInventoryData", GetInventoryData); // Get the inventory data
router.post("/UpdateInventoryData", UpdateInventoryData); // Update the inventory data
router.post("/FilterInventoryData", FilterInventoryData); // Filter the inventory data

module.exports = router;