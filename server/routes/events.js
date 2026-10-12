
const express = require("express");
const router = express.Router();

const {
  createEvent,
  getSessions,
  getSessionEvents,
  getTrackedPages,
  getHeatmapData
} = require("../controllers/eventController");

router.post("/events", createEvent);

router.get("/sessions", getSessions);
router.get("/sessions/:sessionId/events", getSessionEvents);

router.get("/heatmap/pages", getTrackedPages);
router.get("/heatmap", getHeatmapData);

module.exports = router;
