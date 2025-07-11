import express, { RequestHandler } from "express";
import mongoose from "mongoose";
import User from "../Models/User.model";
import Event from "../Models/Event.model";
import verifyToken from "../views/middlewares";

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

const createEvent: RequestHandler<{}, any, CreateEventRequestBody> = async (req, res) => {
    try {
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

        if (!participantIds.some(id => id.equals(userObjectId))) {
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
            location: req.body.location,
            recurrenceRule: req.body.recurrenceRule,
            userId: userObjectId, // store as ObjectId
            participants: participantIds,
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

router.post("/events", verifyToken, createEvent);

export default router;
