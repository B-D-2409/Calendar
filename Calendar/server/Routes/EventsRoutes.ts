import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../Models/User.model";
import verifyToken from "../views/middlewares";
import { verifyAdmin } from "../views/middlewares";
import mongoose from "mongoose";

const router = express.Router();






export default router;