import mongoose from "mongoose";
import express, { RequestHandler } from "express";
import ContactListModel from "../Models/ContactListModel";
import { AuthenticatedRequest } from "../types";
import verifyToken from "../views/middlewares";

const router = express.Router();

interface IContactList {
    title: string;
    creator: string;
    contacts: string[];
}

const createContactList: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const { title, contacts } = req.body;
        const creator = req.user.id;

        const newList = new ContactListModel({ title, creator, contacts });
        await newList.save();

        res.status(200).json(newList);
    } catch (error: any) {
        console.error("Error creating contacts list:", error);
        res.status(500).json({ message: error.message });
    }
};

router.post("/api/contact-lists", verifyToken, createContactList);

const getContactLists: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const creator = req.user.id;

        console.log("Looking up contact lists for creator:", creator);

        const lists = await ContactListModel.find({ creator }).populate("contacts");

        console.log(`Found ${lists.length} contact lists for creator ${creator}`);

        res.status(200).json(lists);
    } catch (error: any) {
        console.error("Error in getContactLists:", error);
        res.status(500).json({ message: error.message });
    }
};

router.get("/api/contact-lists", verifyToken, getContactLists);

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

router.delete("/api/contact-lists/:id", verifyToken, deleteContactList);

router.delete("/api/contact-lists/:listId/contacts/:userId", verifyToken, async (req: AuthenticatedRequest, res) => {
    const { listId, userId } = req.params;
    try {
        const list = await ContactListModel.findById(listId);
        if (!list) return res.status(404).json({ message: "List not found" });

        list.contacts = list.contacts.filter(
            (contact) => contact.toString() !== userId
        );

        await list.save();

        const updatedList = await ContactListModel.findById(listId).populate(
            "contacts",
            "username email phone"
        );

        res.json({ message: "Contact removed", contacts: updatedList?.contacts });
    } catch (error: any) {
        console.error("Error removing contact:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
