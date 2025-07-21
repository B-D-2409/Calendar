import express, { RequestHandler } from "express";
import mongoose from "mongoose";
import User from "../Models/User.model";
import Event from "../Models/Event.model";
import verifyToken from "../views/middlewares";
import { AuthenticatedRequest } from "../types";
import EventSeries from "../Models/SeriesOfEvents.model";

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

router.post("/", verifyToken, createEvent);

const getAllEvents: RequestHandler = async (req, res) => {
  try {
    const events = await Event.find().populate("participants", "username");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get("/events", getAllEvents);

const getAllPublicEvents: RequestHandler = async (req, res) => {
  try {
    const events = await Event.find({ type: "public" });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.get("/public", getAllPublicEvents);


const getMyEvents: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const events = await Event.find({
      userId: req.user.id,
    }).populate("participants", "username");

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};
router.get("/mine", verifyToken, getMyEvents);
const getMyEventsParticipants: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const events = await Event.find({ participants: req.user.id }).populate(
      "participants",
      "username"
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};
router.get("/participants", verifyToken, getMyEventsParticipants);

// public event by id
const getPublicEventById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findOne({ _id: id, type: "public" });

    if (!event) return res.status(404).json({ error: "Event not found or not public" });

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get("/api/events/public/:id", getPublicEventById);





const getEventById: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findOne({
      _id: id,
      $or: [{ userId: req.user.id }, { type: "public" }],
    }).populate("participants", "username");

    if (!event) return res.status(404).json({ error: "Event not found" });

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get("/details/:id", verifyToken, getEventById);

const leaveEvent: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.participants.some((p) => p.toString() === userId)) {
      return res
        .status(400)
        .json({ message: "You are not a participant of this event" });
    }

    event.participants = event.participants.filter(
      (p) => p.toString() !== userId
    );

    await event.save();

    res.json({ message: "Left the event successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

router.delete("/api/events/:id/leave", verifyToken, leaveEvent);

const inviteParticipant: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { username } = req.body;

    const eventId = req.params.id;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const userToInvite = await User.findOne({
      username: new RegExp(`^${username}$`, "i"),
    });

    if (!userToInvite) {
      return res.status(404).json({ message: "User not found" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (
      event.participants.some(
        (id) => id.toString() === userToInvite._id.toString()
      )
    ) {
      return res.status(400).json({ message: "User already a participant" });
    }

    event.participants.push(userToInvite._id);

    await event.save();

    res.json({ message: "User invited successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
router.post("/api/events/invite/:id", verifyToken, inviteParticipant);

const deleteEvent: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to delete this event",
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.delete("/api/events/:id", verifyToken, deleteEvent);


const seriesOfEventsDelete: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const seriesId = req.params.id;
    const series = await EventSeries.findById(seriesId);

    if (!series) {
      return res.status(404).json({ message: "Event series not found" });
    }

    if (series.creatorId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to delete this event series",
      });
    }

    await EventSeries.findByIdAndDelete(seriesId);

    res.status(200).json({ message: "Event series deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.delete("/api/event-series/:id", verifyToken, seriesOfEventsDelete);



const changeEvent: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to update this event",
      });
    }

    Object.assign(event, req.body);

    await event.save();

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.put("/api/events/:id", verifyToken, changeEvent);

const changeSeriesOfEvents: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const seriesId = req.params.id;
    const series = await EventSeries.findById(seriesId);

    if (!series) {
      return res.status(404).json({ message: "Event series not found" });
    }

    if (series.creatorId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to update this event series",
      });
    }

    Object.assign(series, req.body);

    await series.save();

    res.status(200).json(series);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.put("/api/event-series/:id", verifyToken, changeSeriesOfEvents);

const getSeriesEvents: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const series = await EventSeries.find({ creatorId: req.user.id });
    res.json(series);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
router.get("/api/event-series", verifyToken, getSeriesEvents);







export default router;
