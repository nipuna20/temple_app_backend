const express = require("express");
const jwt = require("jsonwebtoken");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { Event, EventRegistration } = require("../models");

const router = express.Router();

// Anyone can fetch stream status
router.get("/:eventId", async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        res.json({
            eventId: event.id,
            isLive: !!event.isLive,
            streamUrl: event.streamUrl || "",
            isPaid: Number(event.amount || 0) > 0,
        });
    } catch (err) {
        console.error("Error fetching stream status:", err);
        res.status(500).json({ message: "Error fetching stream status" });
    }
});

// Access check for viewing stream
router.get("/:eventId/access", authenticateOptional, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.eventId);
        if (!event) {
            return res.status(404).json({ allowed: false, reason: "EVENT_NOT_FOUND" });
        }

        const isPaidEvent = Number(event.amount || 0) > 0;

        // Free event: allow everyone
        if (!isPaidEvent) {
            return res.json({ allowed: true });
        }

        // Paid event: must be logged in
        if (!req.user || !req.user.id) {
            return res.status(401).json({ allowed: false, reason: "LOGIN_REQUIRED" });
        }

        const reg = await EventRegistration.findOne({
            where: {
                eventId: event.id,
                userId: req.user.id,
            },
        });

        if (!reg) {
            return res.status(403).json({ allowed: false, reason: "NOT_REGISTERED" });
        }

        if (reg.paymentStatus !== "paid") {
            return res.status(403).json({ allowed: false, reason: "PAYMENT_REQUIRED" });
        }

        return res.json({ allowed: true });
    } catch (err) {
        console.error("Stream access check error:", err);
        return res.status(500).json({ allowed: false, reason: "SERVER_ERROR" });
    }
});

// Admin updates stream URL
router.post("/:eventId/url", authenticate, requireAdmin, async (req, res) => {
    try {
        const { streamUrl } = req.body;
        const event = await Event.findByPk(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        await event.update({ streamUrl });
        res.json({ message: "Stream URL updated", streamUrl });
    } catch (err) {
        console.error("Error updating stream URL:", err);
        res.status(500).json({ message: "Error updating stream URL" });
    }
});

// Admin start live
router.post("/:eventId/start", authenticate, requireAdmin, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        await event.update({ isLive: true });
        res.json({ message: "Stream started", isLive: true });
    } catch (err) {
        console.error("Error starting stream:", err);
        res.status(500).json({ message: "Error starting stream" });
    }
});

// Admin stop live
router.post("/:eventId/stop", authenticate, requireAdmin, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        await event.update({ isLive: false });
        res.json({ message: "Stream stopped", isLive: false });
    } catch (err) {
        console.error("Error stopping stream:", err);
        res.status(500).json({ message: "Error stopping stream" });
    }
});

// Optional auth middleware
function authenticateOptional(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return next();
    }

    const token = auth.substring("Bearer ".length);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        req.user = decoded;
    } catch (err) {
        // invalid token -> treat as guest
    }

    next();
}

module.exports = router;