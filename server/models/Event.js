const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true
  },
  event_type: {
    type: String,
    enum: ["page_view", "click"],
    required: true
  },
  page_url: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  click_x: {
    type: Number,
    default: null
  },
  click_y: {
    type: Number,
    default: null
  },
  viewport_width: Number,
  viewport_height: Number
});

module.exports = mongoose.model("Event", eventSchema);