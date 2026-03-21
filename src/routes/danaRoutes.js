const express = require("express");
const { DanaBooking, User, Notification } = require("../models");
const { Op } = require("sequelize");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Create booking OR request existing booking
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      date,
      mealType,
      recurring = false,
      recurrenceType = null,
      requestMessage = "",
      address = "",
      phone = "",
    } = req.body;

    if (!date || !mealType) {
      return res.status(400).json({ message: "Date and mealType are required" });
    }

    if (!String(address).trim() || !String(phone).trim()) {
      return res.status(400).json({
        message: "Physical address and mobile number are required",
      });
    }

    let normalizedDate;
    try {
      normalizedDate = new Date(date);
      if (Number.isNaN(normalizedDate.getTime())) {
        throw new Error("Invalid date");
      }
      normalizedDate.setUTCHours(0, 0, 0, 0);
    } catch (e) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const requester = await User.findByPk(req.user.id, {
      attributes: ["id", "firstName", "lastName", "email"],
    });

    const booking = await DanaBooking.findOne({
      where: {
        date: normalizedDate,
        mealType,
        status: { [Op.ne]: "declined" },
      },
      include: [
        { model: User, attributes: ["id", "firstName", "lastName", "email"] },
        { model: User, as: "requestUser", attributes: ["id", "firstName", "lastName", "email"] },
      ],
    });

    // Free slot -> create new booking
    if (!booking) {
      const created = await DanaBooking.create({
        date: normalizedDate,
        mealType,
        recurring,
        recurrenceType,
        userId: req.user.id,
        status: "pending",
        requestStatus: "none",
        ownerAddress: String(address).trim(),
        ownerPhone: String(phone).trim(),
      });

      try {
        const admins = await User.findAll({
          where: { role: "admin" },
          attributes: ["id"],
        });

        const dateStr = normalizedDate.toISOString().substring(0, 10);

        await Promise.all(
          admins.map((admin) =>
            Notification.create({
              userId: admin.id,
              bookingId: created.id,
              message: `New Dana booking submitted for ${mealType} on ${dateStr}.`,
            })
          )
        );
      } catch (notifyErr) {
        console.error("Error creating admin notification:", notifyErr);
      }

      return res.json({
        action: "booked",
        message: "Dana booking submitted successfully.",
        booking: created,
      });
    }

    // same owner cannot request own slot
    if (booking.userId === req.user.id) {
      return res.status(400).json({ message: "You already own this Dana slot." });
    }

    // block multiple pending requests
    if (
      booking.requestStatus === "pending" &&
      booking.requestUserId &&
      booking.requestUserId !== req.user.id
    ) {
      return res.status(400).json({
        message: "This slot already has a pending request.",
      });
    }

    if (booking.requestStatus === "pending" && booking.requestUserId === req.user.id) {
      return res.status(400).json({
        message: "You already requested this Dana slot.",
      });
    }

    await booking.update({
      requestUserId: req.user.id,
      requestStatus: "pending",
      requestMessage: String(requestMessage || "").trim() || null,
      requestAddress: String(address).trim(),
      requestPhone: String(phone).trim(),
    });

    if (booking.userId) {
      const dateStr =
        booking.date instanceof Date
          ? booking.date.toISOString().substring(0, 10)
          : new Date(booking.date).toISOString().substring(0, 10);

      const requesterName = requester
        ? `${requester.firstName || ""} ${requester.lastName || ""}`.trim() || requester.email
        : "Another user";

      const note = String(requestMessage || "").trim();

      await Notification.create({
        userId: booking.userId,
        bookingId: booking.id,
        message: note
          ? `${requesterName} requested your ${mealType} Dana booking on ${dateStr}.`
          : `${requesterName} requested your ${mealType} Dana booking on ${dateStr}.`,
      });
    }

    const updated = await DanaBooking.findByPk(booking.id, {
      include: [
        { model: User, attributes: ["id", "firstName", "lastName", "email"] },
        { model: User, as: "requestUser", attributes: ["id", "firstName", "lastName", "email"] },
      ],
    });

    return res.json({
      action: "requested",
      message: "Request sent to the booked user.",
      booking: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating Dana booking request" });
  }
});

// Logged-in user's own bookings
router.get("/my-bookings", authenticate, async (req, res) => {
  try {
    const bookings = await DanaBooking.findAll({
      where: { userId: req.user.id },
      order: [["date", "ASC"]],
      include: [
        { model: User, attributes: ["id", "firstName", "lastName", "email"] },
        { model: User, as: "requestUser", attributes: ["id", "firstName", "lastName", "email"] },
      ],
    });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching my Dana bookings" });
  }
});

// Admin list
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const bookings = await DanaBooking.findAll({
      include: [
        { model: User, attributes: ["id", "firstName", "lastName", "email"] },
        { model: User, as: "requestUser", attributes: ["id", "firstName", "lastName", "email"] },
      ],
      order: [["date", "ASC"], ["mealType", "ASC"]],
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Public calendar
router.get("/calendar", async (req, res) => {
  try {
    const bookings = await DanaBooking.findAll({
      where: {
        status: { [Op.ne]: "declined" },
      },
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
      order: [["date", "ASC"], ["mealType", "ASC"]],
    });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Accept / reject request
router.put("/:id/respond", authenticate, async (req, res) => {
  try {
    const booking = await DanaBooking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const { status } = req.body;

    if (!["approved", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid response status" });
    }

    if (!booking.requestUserId) {
      return res.status(400).json({ message: "This booking has no requester." });
    }

    if (booking.requestStatus !== "pending") {
      return res.status(400).json({
        message: `This booking request is not pending. Current status: ${booking.requestStatus}`,
      });
    }

    if (req.user.role !== "admin" && req.user.id !== booking.userId) {
      return res.status(403).json({
        message: "Only the booked user or admin can respond to this request.",
      });
    }

    const requestUser = await User.findByPk(booking.requestUserId);

    if (!requestUser) {
      return res.status(400).json({
        message: "The requesting user no longer exists.",
      });
    }

    const dateStr = new Date(booking.date).toISOString().substring(0, 10);
    const requestUserId = booking.requestUserId;

    if (status === "approved") {
      await booking.update({
        userId: requestUserId,
        ownerAddress: booking.requestAddress,
        ownerPhone: booking.requestPhone,
        requestUserId: null,
        requestStatus: "none",
        requestMessage: null,
        requestAddress: null,
        requestPhone: null,
      });

      await Notification.create({
        userId: requestUserId,
        bookingId: booking.id,
        message: `Your request for ${booking.mealType} Dana on ${dateStr} was accepted.`,
      });
    } else {
      await booking.update({
        requestUserId: null,
        requestStatus: "none",
        requestMessage: null,
        requestAddress: null,
        requestPhone: null,
      });

      await Notification.create({
        userId: requestUserId,
        bookingId: booking.id,
        message: `Your request for ${booking.mealType} Dana on ${dateStr} was rejected.`,
      });
    }

    const updated = await DanaBooking.findByPk(booking.id, {
      include: [
        { model: User, attributes: ["id", "firstName", "lastName", "email"] },
        { model: User, as: "requestUser", attributes: ["id", "firstName", "lastName", "email"] },
      ],
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error responding to request" });
  }
});

// Admin update booking status
router.put("/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const booking = await DanaBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Not found" });

    const { status } = req.body;
    if (!["approved", "declined", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await booking.update({ status });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating booking status" });
  }
});

module.exports = router;