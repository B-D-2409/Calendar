

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import AuthenticationRoutes from "../Routes/Authentication.routes.ts";




/**
 * @constant {Object} app - The Express application instance.
 */
const app = express();

/**
 * @constant {Object} server - The HTTP server instance created using the Express application.
 */
const server = http.createServer(app);

/**
 * @constant {Object} io - The Socket.IO server instance configured with CORS options.
 */
const FRONTEND_URL = process.env.VITE_FRONT_END_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
    credentials: true,
  })
);


/**
 * Sets the Socket.IO instance to the Express application for global access.
 */
app.set("io", io);

/**
 * Middleware to parse incoming JSON requests.
 */
app.use(express.json());

/**
 * Middleware to log all incoming requests.
 * @function
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 */
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

/**
 * Route for authentication-related operations.
 * @route /api/auth
 */
app.use();

/**
 * Route for managing contacts.
 * @route /api/contacts
 */
app.use('api/auth' AuthenticationRoutes);

/**
 * Connects to MongoDB using the connection string from environment variables.
 * Sets up the Socket.IO server and event-related routes upon successful connection.
 */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ connect with MongoDB!");

    /**
     * Handles Socket.IO connections.
     * @event connection
     * @param {Object} socket - The connected socket instance.
     */
    io.on("connection", (socket) => {
      console.log("🟢 New client connected", socket.id);

      /**
       * Handles a user joining a room.
       * @event join-room
       * @param {string} userId - The ID of the user joining the room.
       */
      socket.on("join-room", (userId) => {
        console.log(`User ${userId} joined their room`);
        socket.join(userId);
      });

      /**
       * Handles client disconnection.
       * @event disconnect
       */
      socket.on("disconnect", () => {
        console.log("🔴 Client disconnected", socket.id);
      });
    });

    
/**
 * @description Starts the server and listens on the specified port.
 * @param {number} [process.env.PORT=8000] - The port on which the server listens.
 */
server.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 8000}`);
  });
  
  /**
   * @description Handles MongoDB connection errors.
   * @param {Error} err - The error object.
   */
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
  