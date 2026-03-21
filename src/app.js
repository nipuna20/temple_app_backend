require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const { initDb } = require("./models");

// Import routes
const authRoutes = require("./routes/authRoutes");
const contentRoutes = require("./routes/contentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const donationRoutes = require("./routes/donationRoutes");
const blogRoutes = require("./routes/blogRoutes");
const communityRoutes = require("./routes/communityRoutes");
const publicationRoutes = require("./routes/publicationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const danaRoutes = require("./routes/danaRoutes");
const monthlyRoutes = require("./routes/monthlyRoutes");
const chatRoutes = require("./routes/chatRoutes");
const streamRoutes = require("./routes/streamRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const poyaRoutes = require("./routes/poyaRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Allow frontend origin (optional strict)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true, // set CORS_ORIGIN=http://localhost:3000 for strict mode
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dana", danaRoutes);
app.use("/api/monthly", monthlyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/poya", poyaRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * ✅ Socket.IO server
 * Rooms:
 * - event-<eventId> : chat + stream signaling per event
 */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // Join event room
  socket.on("joinEventRoom", ({ eventId }) => {
    if (!eventId) return;
    socket.join(`event-${eventId}`);
  });

  // Leave event room
  socket.on("leaveEventRoom", ({ eventId }) => {
    if (!eventId) return;
    socket.leave(`event-${eventId}`);
  });

  // Event chat message (broadcast)
  socket.on("eventMessage", ({ eventId, message, user }) => {
    if (!eventId || !message) return;
    io.to(`event-${eventId}`).emit("eventMessage", {
      eventId,
      message,
      user, // you can pass {name, email} from frontend
      createdAt: new Date().toISOString(),
    });
  });

  /**
   * (Optional for future) WebRTC signaling events:
   * offer/answer/ice-candidate relayed in the room.
   */
  socket.on("webrtc-offer", ({ eventId, offer }) => {
    if (!eventId || !offer) return;
    socket.to(`event-${eventId}`).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ eventId, answer }) => {
    if (!eventId || !answer) return;
    socket.to(`event-${eventId}`).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice-candidate", ({ eventId, candidate }) => {
    if (!eventId || !candidate) return;
    socket.to(`event-${eventId}`).emit("webrtc-ice-candidate", { candidate });
  });
});

// Start server
async function start() {
  try {
    await initDb();
    console.log("Database synchronized");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO ready on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server", err);
  }
}

start();