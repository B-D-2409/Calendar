import express, { RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../Models/User.model";
import verifyToken from "../views/middlewares";
import { AuthenticatedRequest } from "../types";
import DeleteRequest from "../Models/DeleteRequest.model";
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
interface RegisterRequestBody {
    username: string;
    phoneNumber: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

interface LoginRequestBody {
    email: string;
    password: string;
}


/**
 * Handler for user registration.
 * Validates input, checks if user exists,
 * hashes password, creates user, and returns JWT token.
 */
const registerHandler: RequestHandler<{}, any, RegisterRequestBody> = async (req, res) => {
    try {
        const { username, phoneNumber, email, password, firstName, lastName } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ msg: "User already exists" });
            return;
        }

        if (password.length < 8 || password.length > 30 || !/[A-Za-z]/.test(password)) {
            res.status(400).send({
                message: "Password must be 8-30 characters long and include at least one letter (A-Z).",
            });
            return;
        }

        if (!/^0[0-9]{9}$/.test(phoneNumber)) {
            res.status(400).json({
                message: "Phone number must start with 0, contain only digits 0-9, and be exactly 10 digits long.",
            });
            return;
        }

        if (
            !firstName || !lastName ||
            firstName.length < 1 || firstName.length > 30 ||
            lastName.length < 1 || lastName.length > 30 ||
            !/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)
        ) {
            res.status(400).send({
                message: "First and last names must be 1-30 characters long and contain only letters (A-Z or a-z).",
            });
            return;
        }


        const newUser = new User({
            username,
            phoneNumber,
            email,
            password,
            firstName,
            lastName,
            role: "user",
            isBlocked: false,
        });

        await newUser.save();

        const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            JWT_SECRET,
            { expiresIn: "1h" }
        );


        res.status(201).json({ user: newUser, token });
        return;
    } catch (err: any) {
        res.status(500).json({ msg: err.message });
        return;
    }
};

router.post("/register", registerHandler);


/**
 * Handler for user login.
 * Validates credentials, checks if user is blocked,
 * compares password hash, and returns JWT token.
 */
const loginHandler: RequestHandler<{}, any, LoginRequestBody> = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "Invalid email!" });
            return;
        }

        if (user.isBlocked) {
            res.status(403).json({
                message: "Your account has been blocked. Please contact the administrator.",
            });
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(400).json({ message: "Invalid password!" });
            return;
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err: any) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error during login" });
    }
};

router.post("/login", loginHandler);

/**
 * Handler to create a user account delete request.
 * Requires authenticated user and request body with userId, username, and reason.
 */
const createDeleteRequest: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const { userId, username, reason } = req.body;

        if (!userId || !username) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newRequest = new DeleteRequest({
            userId,
            username,
            reason,
        });

        await newRequest.save();

        res.status(201).json({ message: "Delete request submitted successfully" });
    } catch (err) {
        console.error("Failed to create delete request:", err);
        res.status(500).json({ message: "Server error" });
    }
};
router.post("/delete-requests", verifyToken, createDeleteRequest);


/**
 * Handler for logging out a user.
 * Clears the refresh token cookie.
 */
const postLogOut: RequestHandler = (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
};
router.post("/logout", verifyToken, postLogOut);

/**
 * Route to get all users without their passwords.
 * Requires valid token.
 */
router.get("/users", verifyToken, async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * Route to get current authenticated user's data.
 */
const getUsersMe: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
router.get("/me", verifyToken, getUsersMe);


export default router;
