import mongoose from "mongoose";
import bcrypt from "bcrypt";
/**
 * Interface representing a User document in MongoDB.
 */
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


/**
* Mongoose schema for User collection.
* @property {string} username - Unique username of the user.
* @property {string} phoneNumber - Unique phone number of the user.
* @property {string} email - Unique email address of the user.
* @property {string} password - Hashed password.
* @property {string} firstName - User's first name.
* @property {string} lastName - User's last name.
* @property {("user" | "admin")} role - Role of the user, either "user" or "admin". Defaults to "user".
* @property {string} avatar - URL to user's avatar image.
* @property {string} [address] - Optional address of the user.
* @property {boolean} isBlocked - Flag indicating if the user is blocked. Defaults to false.
*/
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

/**
 * Pre-save hook to hash the password if it has been modified.
 */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

export default mongoose.model("User", userSchema);
