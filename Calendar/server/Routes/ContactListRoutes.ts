import mongoose from "mongoose";
import express, { RequestHandler } from "express";
import ContactListModel from "../Models/ContactListModel";
import { AuthenticatedRequest } from "../types";
import verifyToken from "../views/middlewares";
import EventModel from "../Models/Event.model";
import UserModel from "../Models/User.model";
const router = express.Router();

interface IContactList {
    title: string;
    creator: string;
    contacts: string[];
}

// CREATE a new contact list
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

// GET all contact lists for the authenticated user
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

// DELETE a contact list by ID
// Delete entire contact list by listId
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
// Delete a contact inside a contact list
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
