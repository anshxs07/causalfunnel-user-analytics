
const Event = require("../models/Event");

const isValidPageUrl = (value) => {
  if (typeof value !== "string" || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

// POST /api/events
exports.createEvent = async (req, res, next) => {
  try {
    const {
      session_id,
      event_type,
      page_url,
      timestamp,
      click_x,
      click_y,
      viewport_width,
      viewport_height
    } = req.body;

    if (
      typeof session_id !== "string" ||
      !session_id.trim() ||
      session_id.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid session_id is required"
      });
    }

    if (!["page_view", "click"].includes(event_type)) {
      return res.status(400).json({
        success: false,
        message: "event_type must be page_view or click"
      });
    }

    if (!isValidPageUrl(page_url)) {
      return res.status(400).json({
        success: false,
        message: "A valid HTTP or HTTPS page_url is required"
      });
    }

    let eventTimestamp = new Date();

    if (timestamp !== undefined) {
      if (
        typeof timestamp !== "string" &&
        typeof timestamp !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid timestamp"
        });
      }

      eventTimestamp = new Date(timestamp);

      if (Number.isNaN(eventTimestamp.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid timestamp"
        });
      }

      // Reject timestamps excessively far from server time.
      if (Math.abs(Date.now() - eventTimestamp.getTime()) > 86400000) {
        return res.status(400).json({
          success: false,
          message: "Timestamp must be within 24 hours of server time"
        });
      }
    }

    const eventData = {
      session_id: session_id.trim(),
      event_type,
      page_url,
      timestamp: eventTimestamp
    };

    if (event_type === "click") {
      if (
        !Number.isFinite(click_x) ||
        !Number.isFinite(click_y) ||
        click_x < 0 ||
        click_y < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Click events require valid click_x and click_y"
        });
      }

      eventData.click_x = click_x;
      eventData.click_y = click_y;

      for (const [key, value] of [
        ["viewport_width", viewport_width],
        ["viewport_height", viewport_height]
      ]) {
        if (
          value !== undefined &&
          (!Number.isInteger(value) || value < 1 || value > 100000)
        ) {
          return res.status(400).json({
            success: false,
            message: `${key} must be a positive integer`
          });
        }

        if (value !== undefined) {
          eventData[key] = value;
        }
      }

      if (
        (viewport_width !== undefined && click_x > viewport_width) ||
        (viewport_height !== undefined && click_y > viewport_height)
      ) {
        return res.status(400).json({
          success: false,
          message: "Click coordinates cannot exceed viewport dimensions"
        });
      }
    }

    const event = await Event.create(eventData);

    return res.status(201).json({
      success: true,
      message: "Event stored successfully",
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sessions
exports.getSessions = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "page must be positive and limit must be between 1 and 100"
      });
    }

    const skip = (page - 1) * limit;

    const [sessions, countResult] = await Promise.all([
      Event.aggregate([
        {
          $group: {
            _id: "$session_id",
            total_events: { $sum: 1 },
            page_views: {
              $sum: {
                $cond: [{ $eq: ["$event_type", "page_view"] }, 1, 0]
              }
            },
            clicks: {
              $sum: {
                $cond: [{ $eq: ["$event_type", "click"] }, 1, 0]
              }
            },
            first_seen: { $min: "$timestamp" },
            last_seen: { $max: "$timestamp" }
          }
        },
        { $sort: { last_seen: -1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            session_id: "$_id",
            total_events: 1,
            page_views: 1,
            clicks: 1,
            first_seen: 1,
            last_seen: 1
          }
        }
      ]),
      Event.distinct("session_id")
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total_sessions: countResult.length,
      total_pages: Math.ceil(countResult.length / limit),
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sessions/:sessionId/events
exports.getSessionEvents = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 100);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters"
      });
    }

    const filter = { session_id: sessionId };

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ timestamp: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      session_id: sessionId,
      page,
      limit,
      total_events: total,
      total_pages: Math.ceil(total / limit),
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/heatmap/pages
exports.getTrackedPages = async (req, res, next) => {
  try {
    const pages = await Event.aggregate([
      { $match: { event_type: "click" } },
      {
        $group: {
          _id: "$page_url",
          total_clicks: { $sum: 1 }
        }
      },
      { $sort: { total_clicks: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          page_url: "$_id",
          total_clicks: 1
        }
      }
    ]);

    return res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/heatmap?url=https%3A%2F%2Fexample.com
exports.getHeatmapData = async (req, res, next) => {
  try {
    const pageUrl = req.query.url;

    if (!isValidPageUrl(pageUrl)) {
      return res.status(400).json({
        success: false,
        message: "A valid url query parameter is required"
      });
    }

    const clicks = await Event.find({
      page_url: pageUrl,
      event_type: "click"
    })
      .select(
        "session_id timestamp click_x click_y viewport_width viewport_height -_id"
      )
      .sort({ timestamp: -1 })
      .limit(5000)
      .lean();

    return res.json({
      success: true,
      page_url: pageUrl,
      total_clicks: clicks.length,
      truncated: clicks.length === 5000,
      data: clicks
    });
  } catch (error) {
    next(error);
  }
};
