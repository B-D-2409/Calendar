import mongoose from "mongoose";
import bcrypt from "bcrypt";

export interface UserDocument extends Document {
    username: string;
    phoneNumber: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "user" | "admin";
    avatar: string;
    address?: string;
    isBlocked: boolean;
    id: string;
  }
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, default: "https://example.com/default-avatar.png" },
    address: { type: String },
    isBlocked: {
        type: Boolean,
        default: false,
    },
});


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

export default mongoose.model("User", userSchema);
