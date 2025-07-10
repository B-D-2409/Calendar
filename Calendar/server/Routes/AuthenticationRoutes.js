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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_model_js_1 = __importDefault(require("../Models/User.model.js"));
const middlewares_js_1 = __importDefault(require("../views/middlewares.js"));
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
const registerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, phoneNumber, email, password, firstName, lastName } = req.body;
        const existingUser = yield User_model_js_1.default.findOne({ email });
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
        if (!firstName || !lastName ||
            firstName.length < 1 || firstName.length > 30 ||
            lastName.length < 1 || lastName.length > 30 ||
            !/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)) {
            res.status(400).send({
                message: "First and last names must be 1-30 characters long and contain only letters (A-Z or a-z).",
            });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newUser = new User_model_js_1.default({
            username,
            phoneNumber,
            email,
            password,
            firstName,
            lastName,
            role: "user",
            isBlocked: false,
        });
        yield newUser.save();
        const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
        const token = jsonwebtoken_1.default.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(201).json({ user: newUser, token });
        return;
    }
    catch (err) {
        res.status(500).json({ msg: err.message });
        return;
    }
});
router.post("/register", middlewares_js_1.default, registerHandler);
const loginHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_model_js_1.default.findOne({ email });
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
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match) {
            res.status(400).json({ message: "Invalid password!" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error during login" });
    }
});
router.post("/login", loginHandler);
exports.default = router;
