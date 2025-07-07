import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import AuthenticationRoutes from "./Routes/AuthenticationRoutes";
import verifyToken from "./views/middlewares";
import { verifyAdmin } from "./views/middlewares";
import Event from './Models/Event.model';
import EventsRoutes from "./Routes/EventsRoutes";

const app = express();

const server = http.createServer(app);

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

app.set("io", io);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// FIXED: added missing leading slash here:
app.use('/api/auth', AuthenticationRoutes);
app.use('/api/events', EventsRoutes);

if (!process.env.mongoDB_URL) {
  throw new Error("❌ mongoDB_URL is not defined in .env file");
}

mongoose
  .connect(process.env.mongoDB_URL)
  .then(() => {
    console.log("✅ Connected with MongoDB!");

    io.on("connection", (socket) => {
      console.log("🟢 New client connected", socket.id);

      socket.on("join-room", (userId) => {
        console.log(`User ${userId} joined their room`);
        socket.join(userId);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Client disconnected", socket.id);
      });
    });

    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
