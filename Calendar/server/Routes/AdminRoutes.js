"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_model_1 = __importDefault(require("../Models/User.model"));
const middlewares_1 = __importDefault(require("../views/middlewares"));
const middlewares_2 = require("../views/middlewares");
const DeleteRequest_model_1 = __importDefault(require("../Models/DeleteRequest.model"));
const router = express_1.default.Router();
function getQueryParamAsString(param, defaultValue) {
    if (Array.isArray(param)) {
        // Convert (string | ParsedQs)[] to string if first element is string
        const first = param[0];
        return typeof first === "string" ? first : defaultValue;
    }
    if (typeof param === "string") {
        return param;
    }
    return defaultValue;
}
const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
router.get("/admin", middlewares_2.verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ message: "Welcome to the admin page" });
}));
router.get("/users/admin", middlewares_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageStr = getQueryParamAsString(req.query.page, "1");
        const limitStr = getQueryParamAsString(req.query.limit, "5");
        const page = parseInt(pageStr, 10);
        const limit = parseInt(limitStr, 10);
        const skip = (page - 1) * limit;
        const users = yield User_model_1.default.find().skip(skip).limit(limit);
        const total = yield User_model_1.default.countDocuments();
        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
router.post("/block/:id", middlewares_2.verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield User_model_1.default.findByIdAndUpdate(req.params.id, { isBlocked: true });
        res.json({ message: "User blocked" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to block user" });
    }
}));
router.post("/unblock/:id", middlewares_2.verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield User_model_1.default.findByIdAndUpdate(req.params.id, { isBlocked: false });
        res.json({ message: "User unblocked" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to unblock user" });
    }
}));
const deleteUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedUser = yield User_model_1.default.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            res.status(404).json({ message: "User not found" });
            return; // ensure no further execution
        }
        res.json({ message: "User deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete user" });
    }
});
router.delete("/delete/:id", middlewares_2.verifyAdmin, deleteUserHandler);
const requestDeleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingRequest = yield DeleteRequest_model_1.default.findOne({
            userId: req.user.id,
        });
        if (existingRequest) {
            res.status(400).json({ message: "Delete request already exists" });
            return;
        }
        const newRequest = new DeleteRequest_model_1.default({
            userId: req.user.id,
            username: req.user.username,
            reason: req.body.reason || "User requested account deletion",
        });
        yield newRequest.save();
        res.status(201).json({ message: "Delete request submitted" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post("/request-delete", middlewares_1.default, requestDeleteUser);
const getDeleteRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_model_1.default.findById(req.user.id);
        if ((user === null || user === void 0 ? void 0 : user.role) !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        const requests = yield DeleteRequest_model_1.default.find().populate("userId", "username email");
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get("/delete-requests", middlewares_2.verifyAdmin, getDeleteRequest);
const idRequestDeleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Defensive check for req.user (shouldn't happen if middleware works correctly)
        if (!req.user || !req.user.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = yield User_model_1.default.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.role !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        const request = yield DeleteRequest_model_1.default.findById(req.params.id);
        if (!request) {
            res.status(404).json({ message: "Request not found" });
            return;
        }
        request.status = req.body.status || request.status;
        yield request.save();
        res.json({ message: "Request updated", request });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put("/delete-requests/:id", middlewares_1.default, idRequestDeleteUser);
const searchUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.params;
        const users = yield User_model_1.default.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { phoneNumber: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
            ],
        }).select("-password");
        if (!users || users.length === 0) {
            res.status(404).json({ error: "No users found" });
            return;
        }
        res.status(200).json({ data: users });
    }
    catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/users/search/:query", middlewares_1.default, searchUsers);
exports.default = router;
