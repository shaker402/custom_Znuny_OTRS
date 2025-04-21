const router = require("express").Router();
const {
    createSession,
    createTicket,
    addArticle,
    getTicket,
    ticketSearch,
    addDetectionContext
} = require("../controllers/ZnunyController");

// Znuny API Endpoints
router.post("/nph-genericinterface.pl/Webservice/ALERTELAST_API/GenericTicketConnectorREST/Session", createSession);
router.post("/nph-genericinterface.pl/Webservice/ALERTELAST_API/TicketCreate", createTicket);
router.post("/nph-genericinterface.pl/Webservice/ALERTELAST_API/TicketUpdate", addArticle);
router.post("/nph-genericinterface.pl/Webservice/ALERTELAST_API/TicketGet", getTicket);
router.post("/nph-genericinterface.pl/Webservice/ALERTELAST_API/TicketSearch", ticketSearch);
router.post("/nph-genericinterface.pl/Webservice/ALERTELAST_API/AddDetectionContext/:ticketNumber", addDetectionContext);

module.exports = router;