import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import verifyAdmin from "../verify-token.js";
import verifyToken from "../verify-token.js";
import mongoose from "mongoose";

const router = express.Router();