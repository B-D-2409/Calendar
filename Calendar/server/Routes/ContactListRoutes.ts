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

router.get("/", verifyToken, getContactLists);

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
const deleteContactList: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const deletedList = await ContactListModel.findByIdAndDelete(req.params.id);
        if (!deletedList) {
            return res.status(404).json({ message: "Contact list not found" });
        }
        res.json({ message: "Contact list deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting contact list:", error);
        res.status(500).json({ message: error.message });
    }
};

router.delete("/:id", verifyToken, deleteContactList);



// DELETE a specific contact from a contact list
const deleteContactFromList: RequestHandler = async (req: AuthenticatedRequest, res) => {
    const { listId, userId } = req.params;
    try {
        const list = await ContactListModel.findById(listId);
        if (!list) {
            return res.status(404).json({ message: "Contact list not found" });
        }

        list.contacts = list.contacts.filter(
            (contact) => contact.toString() !== userId
        );

        await list.save();

        const updatedList = await ContactListModel.findById(listId).populate(
            "contacts",
            "username email phone"
        );

        res.json({
            message: "Contact removed from list",
            contacts: updatedList?.contacts || [],
        });
    } catch (error: any) {
        console.error("Error removing contact from list:", error);
        res.status(500).json({ message: error.message });
    }
};

router.delete("/:listId/contacts/:userId", verifyToken, deleteContactFromList);

export default router;
