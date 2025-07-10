"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const deleteRequestSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    username: String,
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["pending", "processed", "rejected"],
        default: "pending",
    },
    reason: {
        type: String,
        default: "User requested account deletion",
    },
});
const DeleteRequest = mongoose_1.default.model("DeleteRequest", deleteRequestSchema);
exports.default = DeleteRequest;
