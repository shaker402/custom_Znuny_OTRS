const router = require("express").Router();

const ResponderRoutes = require("./ResponderRoutes");
const ResourcesRoutes = require("./ResourcesRoutes");
const ToolsRoutes = require("./ToolsRoutes");
const ResultsRoutes = require("./ResultsRoutes");
const ConfigRoutes = require("./ConfigRoutes");
const ProcessRoutes = require("./ProcessRoutes");
const UsersRoutes = require("./UsersRoutes");
const LogsRoutes = require("./LogsRoutes");
const DashboardRoute = require("./DashboardRoute");
const AlertRoutes = require("./AlertRoutes");
const InventoryRoutes = require("./InventoryRoutes");
const DownloadXDRAgentRoutes = require("./DownloadXDRAgentRoutes");
const ComplianceRoutes = require("./ComplianceRoutes");

// Import the new Znuny routes
const ZnunyRoutes = require("./ZnunyRoutes");

router.use("/Resources", ResourcesRoutes);
router.use("/tools", ToolsRoutes);
router.use("/results", ResultsRoutes);
router.use("/config", ConfigRoutes);
router.use("/process", ProcessRoutes);
router.use("/users", UsersRoutes);
router.use("/logs", LogsRoutes);
router.use("/dashboard", DashboardRoute);
router.use("/Alerts", AlertRoutes);
router.use("/Inventory", InventoryRoutes);
router.use("/Compliance", ComplianceRoutes);
router.use("/Responder", ResponderRoutes);
router.use("/xdr", DownloadXDRAgentRoutes);

// Mount Znuny endpoint under /znuny
router.use("/znuny", ZnunyRoutes);

module.exports = router;
