const express = require("express");
const { Notification, DanaBooking, User } = require("../models");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Get current user's notifications
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: DanaBooking,
          attributes: [
            "id",
            "date",
            "mealType",
            "status",
            "userId",
            "requestUserId",
            "requestStatus",
            "requestMessage",
            "ownerAddress",
            "ownerPhone",
            "requestAddress",
            "requestPhone",
          ],
          include: [
            {
              model: User,
              attributes: ["id", "firstName", "lastName", "email"],
            },
            {
              model: User,
              as: "requestUser",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        },
      ],
    });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Mark one notification as read
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await notification.update({ isRead: true });

    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error marking notification as read" });
  }
});

module.exports = router;