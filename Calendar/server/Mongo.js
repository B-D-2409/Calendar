"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const AuthenticationRoutes_1 = __importDefault(require("./Routes/AuthenticationRoutes"));
// import verifyToken from "./views/middlewares";
// import { verifyAdmin } from "./views/middlewares";
// import Event from './Models/Event.model';
const EventsRoutes_1 = __importDefault(require("./Routes/EventsRoutes"));
const AdminRoutes_1 = __importDefault(require("./Routes/AdminRoutes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const FRONTEND_URL = process.env.VITE_FRONT_END_URL || "http://localhost:5173";
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [FRONTEND_URL, "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
        credentials: true,
    },
});
app.use((0, cors_1.default)({
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
    credentials: true,
}));
app.set("io", io);
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});
app.use('/api/auth', AuthenticationRoutes_1.default);
app.use('/api/admin', AdminRoutes_1.default);
app.use('/api/events', EventsRoutes_1.default);
if (!process.env.mongoDB_URL) {
    throw new Error("❌ mongoDB_URL is not defined in .env file");
}
mongoose_1.default
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
