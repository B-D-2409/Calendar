import express, { RequestHandler } from "express";
import mongoose from "mongoose";
import User from "../Models/User.model";
import Event from "../Models/Event.model";
import verifyToken from "../views/middlewares";
import { AuthenticatedRequest } from "../types";

interface CreateEventRequestBody {
    title: string;
    description: string;
    type: string;
    startDateTime: Date;
    endDateTime: Date;
    isRecurring: boolean;
    isLocation: boolean;
    location?: {
        address?: string;
        city?: string;
        country?: string;
    };
    recurrenceRule?: any;
    participants: string[];
}

const router = express.Router();

const createEvent: RequestHandler<{}, any, CreateEventRequestBody> = async (
    req: AuthenticatedRequest,
    res
) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const participantUsernames = req.body.participants || [];

        const participantUsers = await User.find({
            username: { $in: participantUsernames },
        });

        if (participantUsers.length !== participantUsernames.length) {
            return res
                .status(400)
                .json({ error: "One or more participants not found" });
        }

        const participantIds = participantUsers.map((user) => user._id);

        const userObjectId = new mongoose.Types.ObjectId(req.user.id);

        if (!participantIds.some((id) => id.equals(userObjectId))) {
            participantIds.push(userObjectId);
        }

        const newEvent = new Event({
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            startDateTime: req.body.startDateTime,
            endDateTime: req.body.endDateTime,
            isRecurring: req.body.isRecurring,
            isLocation: req.body.isLocation,
            location: req.body.location || {},
            recurrenceRule: req.body.recurrenceRule || null,
            userId: userObjectId,
            participants: participantIds,
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

router.post("/events", verifyToken, createEvent);

router.get("/events", verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user?.role !== "admin") {
            return res.status(403).json({ message: "Access denied: not admin" });
        }

        // Parse and fallback to defaults
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
        const search = req.query.search ? (req.query.search as string) : "";

        const query = {
            name: { $regex: search, $options: "i" },
        };

        const totalEvents = await Event.countDocuments(query);
        const totalPages = Math.ceil(totalEvents / limit);

        const events = await Event.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            events,
            totalPages,
            totalEvents,
            currentPage: page,
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }

})

export default router;
