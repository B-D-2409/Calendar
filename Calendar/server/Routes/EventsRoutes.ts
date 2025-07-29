import express, { RequestHandler } from "express";
import mongoose from "mongoose";
import { Types } from 'mongoose';
import User from "../Models/User.model";
import Event from "../Models/Event.model";
import verifyToken from "../views/middlewares";
import { AuthenticatedRequest } from "../types";
import EventSeries from "../Models/SeriesOfEvents.model";
import SeriesOfEventsModel from "../Models/SeriesOfEvents.model";
interface CreateEventRequestBody {
  title: string;
  description: string;
  type: string;
  startDateTime: Date;
  endDateTime: Date;
  isRecurring: boolean;
  isLocation: boolean;
  creator: string; 
  userId: string; 
  location?: {
    address?: string;
    city?: string;
    country?: string;
  };
  recurrenceRule?: any;
  participants: string[];
}

const router = express.Router();
/**
 * Creates a new event.
 * @route POST /
 * @access Protected
 * @param {AuthenticatedRequest} req - The request object with user info
 * @param {Response} res - The response object
 */
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
      creator: req.user?.id, 
      participants: participantIds,
    });
    

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

router.post("/", verifyToken, createEvent);

/**
 * Invite a user to an event.
 * @route POST /invite/:id
 * @access Protected
 * @param {AuthenticatedRequest} req - Request with user info and body containing username
 * @param {Response} res - Response object
 */
const inviteParticipant: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { username } = req.body;
    const eventId = req.params.id;

    if (!username) {
      console.log("No username provided");
      return res.status(400).json({ message: "Username is required" });
    }

    const userToInvite = await User.findOne({
      username: new RegExp(`^${username}$`, "i"),
    });

    if (!userToInvite) {
      console.log("User not found for username:", username);
      return res.status(404).json({ message: "User not found" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      console.log("Event not found with ID:", eventId);
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.creator) {
      console.log("Event creator missing for event ID:", eventId);
      return res.status(400).json({ message: "Event creator is missing, cannot invite participants" });
    }

    if (event.participants.some(id => id.toString() === userToInvite._id.toString())) {
      console.log(`User ${username} is already a participant`);
      return res.status(400).json({ message: "User already a participant" });
    }

    if (event.invitations.some(id => id.toString() === userToInvite._id.toString())) {
      console.log(`User ${username} is already invited`);
      return res.status(400).json({ message: "User already invited" });
    }

    event.invitations.push(userToInvite._id);

    await event.save();

    res.json({ message: "Invitation sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


router.post("/invite/:id", verifyToken, inviteParticipant);
/**
 * Get all invitations for the logged-in user.
 * @route GET /invitations
 * @access Protected
 */
const getInvitations: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    const events = await Event.find({ invitations: userId }).populate("creator", "username title");

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
router.get("/invitations", verifyToken, getInvitations);


/**
 * Get all events (admin/global).
 * @route GET /
 * @access Public
 */
const getAllEvents: RequestHandler = async (req, res) => {
  try {
    const events = await Event.find().populate("participants", "username");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get("/", getAllEvents);



/**
 * Create a new series of events.
 * @route POST /event-series
 * @access Protected
 */
const createSeriesOfEvents: RequestHandler =  async (req: AuthenticatedRequest, res) => {
  try {
    const newSeries = new SeriesOfEventsModel({
      name: req.body.name,
      creatorId: req.user.id,
      seriesType: req.body.seriesType,
      isIndefinite: req.body.isIndefinite,
      startingEvent: req.body.startingEvent,
      endingEvent: req.body.isIndefinite ? undefined : req.body.endingEvent,
      recurrenceRule:
        req.body.seriesType === "recurring" ? req.body.recurrenceRule : undefined,
      eventsId: req.body.seriesType === "manual" ? req.body.eventsId : [],
    });

    const savedSeries = await newSeries.save();
    res.status(201).json(savedSeries);
  } catch (err) {
    console.error("Error creating event series:", err);
    res.status(400).json({ error: err.message });
  }
};
router.post("/event-series", verifyToken, createSeriesOfEvents);
/**
 * Get all event series created by the logged-in user.
 * @route GET /event-series
 * @access Protected
 */
const getSeriesEvents: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const series = await EventSeries.find({ creatorId: req.user.id });
    res.json(series);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
router.get("/event-series", verifyToken, getSeriesEvents);
/**
 * Get all public events.
 * @route GET /public
 * @access Public
 */
const getAllPublicEvents: RequestHandler = async (req, res) => {
  try {
    const events = await Event.find({ type: "public" });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.get("/public", getAllPublicEvents);

/**
 * Get all events created by the logged-in user.
 * @route GET /mine
 * @access Protected
 */
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


/**
 * Get events where the authenticated user is a participant.
 * Populates participant usernames.
 * 
 * @route GET /participants
 * @access Private
 */
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

/**
 * Get all public events and events related to the authenticated user (created or joined).
 * Combines all events uniquely.
 * 
 * @route GET /all
 * @access Private
 */
const getAllEvent: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const publicEvents = await Event.find({ type: "public" });

    let myEvents = [];
    let participatingEvents = [];

    if (req.user) {
      myEvents = await Event.find({ userId: req.user.id });
      participatingEvents = await Event.find({ participants: req.user.id });
    }

    // Combine into unique events by _id
    const allEventsMap = new Map();
    [...publicEvents, ...myEvents, ...participatingEvents].forEach((event) => {
      allEventsMap.set(event._id.toString(), event);
    });

    res.status(200).json(Array.from(allEventsMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch all events" });
  }
};
router.get("/all", verifyToken, getAllEvent);
/**
 * Join a public event if the user is not the owner or already a participant.
 * 
 * @route POST /:id/join
 * @access Private
 */
const joinPublicEvents: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const userIdObj = new Types.ObjectId(userId); 

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const ownerId = event.userId.toString();

    const isAlreadyParticipant = event.participants.some(
      (p) => p.toString() === userIdObj.toString()
    );

    if (ownerId === userId) {
      return res
        .status(400)
        .json({ error: "Owner cannot join their own event" });
    }

    if (isAlreadyParticipant) {
      return res.status(400).json({ error: "You are already a participant" });
    }

    if (event.type === "private") {
      return res.status(403).json({ error: "Cannot join private event" });
    }

    event.participants.push(userIdObj);
    await event.save();

    return res.status(200).json({
      message: "Successfully joined the event",
      participants: event.participants,
    });
  } catch (err) {
    console.error("Join event error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
router.post("/:id/join", verifyToken,  joinPublicEvents);

/**
 * Get a single public event by ID.
 * 
 * @route GET /api/events/public/:id
 * @access Public
 */
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

/**
 * Accept an invitation to an event by ID.
 * Adds the user as a participant and removes the invitation.
 *
 * @route POST /invitations/:id/accept
 * @access Private
 */

const acceptInvitation: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.invitations = event.invitations.filter(id => id.toString() !== userId);
    event.participants.push(new Types.ObjectId(userId));


    await event.save();

    res.json({ message: "Invitation accepted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
router.post("/invitations/:id/accept", verifyToken, acceptInvitation);

/**
 * Reject an invitation to an event by ID.
 * Removes the invitation without joining the event.
 *
 * @route POST /invitations/:id/reject
 * @access Private
 */
const rejectInvitation: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.invitations = event.invitations.filter(id => id.toString() !== userId);

    await event.save();

    res.json({ message: "Invitation rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
router.post("/invitations/:id/reject", verifyToken, rejectInvitation);



/**
 * Delete an event if the authenticated user is the owner.
 *
 * @route DELETE /:id
 * @access Private
 */
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

router.delete("/:id", verifyToken, deleteEvent);

/**
 * Remove a participant from an event by ID.
 * Only the owner should be allowed to do this.
 *
 * @route DELETE /:id/participants/:participantId
 * @access Private
 */
const removeParticipant: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
      const { id, participantId } = req.params;

      const event = await Event.findById(id);
      if (!event) {
          return res.status(404).json({ message: "Event not found" });
      }

      // Remove participant from the array
      event.participants = event.participants.filter(p => p.toString() !== participantId);
      await event.save();

      const updatedEvent = await Event.findById(id).populate("participants", "username email");

      res.status(200).json({ message: "Participant removed", participants: updatedEvent?.participants });
  } catch (error: any) {
      console.error("Error removing participant:", error);
      res.status(500).json({ message: error.message });
  }
};
router.delete("/:id/participants/:participantId", verifyToken, removeParticipant);


/**
 * Get a single event by ID if it is public or owned by the authenticated user.
 *
 * @route GET /details/:id
 * @access Private
 * @param {string} req.params.id - ID of the event to retrieve
 * @returns {object} 200 - Event object
 * @returns {object} 404 - Event not found
 * @returns {object} 500 - Server error
 */

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
/**
 * Allows the authenticated user to leave a specific event if they are a participant.
 *
 * @route DELETE /:id/leave
 * @access Private
 * @param {string} req.params.id - ID of the event to leave
 * @returns {object} 200 - Confirmation message
 * @returns {object} 400 - User is not a participant
 * @returns {object} 404 - Event not found
 * @returns {object} 500 - Server error
 */

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

router.delete("/:id/leave", verifyToken, leaveEvent);



/**
 * Deletes an event series if the authenticated user is the creator.
 *
 * @route DELETE /api/event-series/:id
 * @access Private
 * @param {string} req.params.id - ID of the event series to delete
 * @returns {object} 200 - Success message
 * @returns {object} 403 - Unauthorized to delete
 * @returns {object} 404 - Series not found
 * @returns {object} 500 - Server error
 */

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


/**
 * Updates an existing event if the authenticated user is the owner.
 *
 * @route PUT /:id
 * @access Private
 * @param {string} req.params.id - ID of the event to update
 * @param {object} req.body - Event update data
 * @returns {object} 200 - Updated event object
 * @returns {object} 403 - Unauthorized to update
 * @returns {object} 404 - Event not found
 * @returns {object} 500 - Server error
 */

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

router.put("/:id", verifyToken, changeEvent);

/**
 * Updates an event series if the authenticated user is the creator.
 *
 * @route PUT /event-series/:id
 * @access Private
 * @param {string} req.params.id - ID of the event series to update
 * @param {object} req.body - Event series update data
 * @returns {object} 200 - Updated series object
 * @returns {object} 403 - Unauthorized to update
 * @returns {object} 404 - Series not found
 * @returns {object} 500 - Server error
 */

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

router.put("/event-series/:id", verifyToken, changeSeriesOfEvents);




export default router;
