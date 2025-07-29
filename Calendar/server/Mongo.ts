/**
 * Load environment variables from .env file into process.env
 */
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import AuthenticationRoutes from "./Routes/AuthenticationRoutes";
import EventsRoutes from "./Routes/EventsRoutes";
import AdminRoutes from "./Routes/AdminRoutes";
import ContactListRoutes from "./Routes/ContactListRoutes";
const app = express();
const server = http.createServer(app);
/**
 * Frontend URL for CORS origin. Defaults to localhost if not specified.
 * @constant {string}
 */
const FRONTEND_URL = process.env.VITE_FRONT_END_URL || "http://localhost:5173";

/**
 * Initialize Socket.IO server with CORS configuration
 * @constant {Server}
 */
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
    credentials: true,
  },
});

/**
 * Middleware to handle CORS for API requests
 */
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
    credentials: true,
  })
);

/**
 * Middleware to parse incoming JSON requests
 */
app.use(express.json());

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});


/**
 * API route handlers
 */
app.use('/api/auth', AuthenticationRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/events', EventsRoutes);
app.use('/api/contacts', ContactListRoutes);


/**
 * Ensure MongoDB connection string is defined
 */
if (!process.env.mongoDB_URL) {
  throw new Error("❌ mongoDB_URL is not defined in .env file");
}

/**
 * Connect to MongoDB and start the server
 */
mongoose
  .connect(process.env.mongoDB_URL)
  .then(() => {
    console.log("✅ Connected with MongoDB!");
    /**
     * Handle new WebSocket client connections
     */
    io.on("connection", (socket) => {
      console.log("🟢 New client connected", socket.id);
      /**
            * Join user-specific socket room
            * @param {string} userId - ID of the user joining the room
            */
      socket.on("join-room", (userId) => {
        console.log(`User ${userId} joined their room`);
        socket.join(userId);
      });

      /**
       * Handle client disconnection
       */
      socket.on("disconnect", () => {
        console.log("🔴 Client disconnected", socket.id);
      });
    });

    /**
     * Start Express server on specified port
     */
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
