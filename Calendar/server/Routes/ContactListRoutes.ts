import mongoose from "mongoose";
import express, { RequestHandler } from "express";
import ContactListModel from "../Models/ContactListModel";
import { AuthenticatedRequest } from "../types";
import verifyToken from "../views/middlewares";
import EventModel from "../Models/Event.model";
import UserModel from "../Models/User.model";
const router = express.Router();
/**
 * Create a new contact list.
 * 
 * @param {AuthenticatedRequest} req - Express request object, extended with authenticated user info.
 * @param {express.Response} res - Express response object.
 * 
 * @returns {Promise<void>} Sends created contact list JSON on success.
 * 
 * @throws {Error} 500 Internal Server Error if creation fails.
 */
const createContactList: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const { title, contacts } = req.body;
        const creator = req.user.id;

        const newList = new ContactListModel({ title, creator, contacts });
        await newList.save();

        res.status(201).json(newList);
    } catch (error: any) {
        console.error("Error creating contact list:", error);
        res.status(500).json({ message: error.message });
    }
};

router.post("/", verifyToken, createContactList);
/**
 * Get all contact lists belonging to the authenticated user.
 * @param {AuthenticatedRequest} req - Request with authenticated user info.
 * @param {express.Response} res - Response object.
 * @returns {Promise<void>}
 */
const getContactLists: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const creator = req.user.id;

        const lists = await ContactListModel.find({ creator }).populate(
            "contacts",
            "username email phone"
        );

        res.status(200).json(lists);
    } catch (error: any) {
        console.error("Error getting contact lists:", error);
        res.status(500).json({ message: error.message });
    }
};

router.get("/lists", verifyToken, getContactLists);
/**
 * Add a participant to an event by IDs.
 * Prevents duplicate participants.
 * @param {AuthenticatedRequest} req - Request with authenticated user info.
 * @param {express.Response} res - Response object.
 * @returns {Promise<void>}
 */
const addParticipantToEvent: RequestHandler = async (req: AuthenticatedRequest, res) => {
    const { eventId, userId } = req.params;
    try {
        const event = await EventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Prevent duplicates
        if (!event.participants.some((id) => id.equals(userObjectId))) {
            event.participants.push(userObjectId);
            await event.save();
        }

        const updatedEvent = await EventModel.findById(eventId).populate("participants", "username email");

        res.status(200).json({ message: "Participant added", participants: updatedEvent?.participants });
    } catch (error: any) {
        console.error("Error adding participant:", error);
        res.status(500).json({ message: error.message });
    }
};

router.post("/:eventId/participants/:userId", verifyToken, addParticipantToEvent);
/**
 * Get a user by username.
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {Promise<void>}
 */
const getUserByUsername: RequestHandler = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await UserModel.findOne({ username }).select("_id username email");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error: any) {
        console.error("Error fetching user by username:", error);
        res.status(500).json({ message: error.message });
    }
};

router.get("/username/:username", verifyToken, getUserByUsername);

/**
 * Delete a contact list by ID.
 * @param {AuthenticatedRequest} req - Request with authenticated user info.
 * @param {express.Response} res - Response object.
 * @returns {Promise<void>}
 */
const deleteContactList: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const { listId } = req.params;

        const deletedList = await ContactListModel.findByIdAndDelete(listId);
        if (!deletedList) {
            return res.status(404).json({ message: "Contact list not found" });
        }

        res.json({ message: "Contact list deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting contact list:", error);
        res.status(500).json({ message: error.message });
    }
};
router.delete("/lists/:listId", verifyToken, deleteContactList);
/**
 * Delete a contact from a specific contact list.
 * @param {AuthenticatedRequest} req - Request with authenticated user info.
 * @param {express.Response} res - Response object.
 * @returns {Promise<void>}
 */
const deleteContactFromList: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const { listId, contactId } = req.params;

        const list = await ContactListModel.findById(listId);
        if (!list) {
            return res.status(404).json({ message: "Contact list not found" });
        }

        // Filter out the contact from the contacts array
        list.contacts = list.contacts.filter(c => c.toString() !== contactId);

        await list.save();

        res.json({ message: "Contact removed from list successfully" });
    } catch (error: any) {
        console.error("Error deleting contact from list:", error);
        res.status(500).json({ message: error.message });
    }
};

router.delete("/lists/:listId/contacts/:contactId", verifyToken, deleteContactFromList);





export default router;
