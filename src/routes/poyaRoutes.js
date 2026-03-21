const express = require("express");
const { PoyaCalendar } = require("../models");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Public: get all poya items
router.get("/", async (req, res) => {
    try {
        const items = await PoyaCalendar.findAll({
            order: [["date", "ASC"]],
        });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching poya calendar items" });
    }
});

// Admin: create poya item
router.post("/", authenticate, requireAdmin, async (req, res) => {
    try {
        const { date, subject, description } = req.body;

        if (!date || !subject || !description) {
            return res.status(400).json({
                message: "Date, subject and description are required",
            });
        }

        const created = await PoyaCalendar.create({
            date,
            subject,
            description,
        });

        res.json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating poya calendar item" });
    }
});

// Admin: delete poya item
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
    try {
        const item = await PoyaCalendar.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Poya item not found" });
        }

        await item.destroy();
        res.json({ message: "Poya item deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting poya calendar item" });
    }
});

module.exports = router;