import express, { RequestHandler } from "express";
import User from "../Models/User.model";
import { verifyAdmin } from "../views/middlewares";
import { ParsedQs } from "qs";
import DeleteRequest from "../Models/DeleteRequest.model";
import { AuthenticatedRequest } from "../types";
import Event from "../Models/Event.model";

const router = express.Router();

function getQueryParamAsString(
    param: string | ParsedQs | (string | ParsedQs)[] | undefined,
    defaultValue: string
): string {
    if (Array.isArray(param)) {
        const first = param[0];
        return typeof first === "string" ? first : defaultValue;
    }
    if (typeof param === "string") {
        return param;
    }
    return defaultValue;
}

const getUsersAdmin: RequestHandler = async (req, res) => {
    try {
        console.log("Fetching users for admin panel...", req);

        const pageStr = getQueryParamAsString(req.query.page, "1");
        const limitStr = getQueryParamAsString(req.query.limit, "10");

        const page = parseInt(pageStr, 10);
        const limit = parseInt(limitStr, 10);
        const skip = (page - 1) * limit;

        const users = await User.find().skip(skip).limit(limit);
        const total = await User.countDocuments();

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};

router.get("/users", verifyAdmin, getUsersAdmin);

const getEventsAdmin: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: no user info" });
        }

        const user = await User.findById(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied: not admin" });
        }

        // Parse and fallback to safe defaults
        let page = parseInt(req.query.page as string, 10);
        if (isNaN(page) || page < 1) page = 1;

        let limit = parseInt(req.query.limit as string, 10);
        if (isNaN(limit) || limit < 1) limit = 5;

        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";


        const query = {
            title: { $regex: search, $options: "i" },
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
        console.error("Error in getEventsAdmin:", err);
        res.status(500).json({ error: (err as Error).message });
    }

};
router.get("/events", verifyAdmin, getEventsAdmin);

/**
 * POST /api/admin/block/:id
 * Blocks a user by ID
 */
router.post("/block/:id", verifyAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to block user" });
    }
});

/**
 * POST /api/admin/unblock/:id
 * Unblocks a user by ID
 */
router.post("/unblock/:id", verifyAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to unblock user" });
    }
});

/**
 * DELETE /api/admin/delete/:id
 * Deletes a user by ID
 */
router.delete("/delete/:id", verifyAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

/**
 * GET /api/admin/delete-requests
 * Returns all delete requests (for admin approval)
 */
router.get("/delete-requests", verifyAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const requests = await DeleteRequest.find().populate("userId", "username email");
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load delete requests" });
    }
});

/**
 * GET /api/events/admin
 * Returns paginated list of events for admin
 */

/**
 * PUT /api/events/admin/:id
 * Updates an event by ID
 */
router.put("/events/admin/:id", verifyAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { title, description } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { title, description },
            { new: true }
        );
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json(event);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update event" });
    }
});

/**
 * DELETE /api/admin/events/:id
 * Deletes an event by ID
 */
router.delete("/events/:id", verifyAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json({ message: "Event deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete event" });
    }
});



const getDeleteRequest: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        const requests = await DeleteRequest.find({ userId: req.user.id });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
router.get("/delete-requests", verifyAdmin, getDeleteRequest);
// controllers/adminController.ts
export const deleteRequestId: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = req.params.id;
  
      const deleteRequest = await DeleteRequest.findById(requestId);
  
      if (!deleteRequest) {
        return res.status(404).json({ message: "Delete request not found" });
      }
  
      const deletedUser = await User.findByIdAndDelete(deleteRequest.userId);
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      await DeleteRequest.findByIdAndDelete(requestId);
  
      return res.status(200).json({
        message: `✅ User ${deletedUser._id} has been deleted successfully.`,
      });
  
    } catch (error: any) {
      console.error("❌ Error deleting user:", error);
      return res.status(500).json({ message: "Server error. Could not delete user." });
    }
  };
  
router.delete("/delete-requests/:id", verifyAdmin, deleteRequestId);
export default router;
