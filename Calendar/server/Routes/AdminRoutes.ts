import express, { RequestHandler, Response, Request } from "express";
import User from "../Models/User.model.js";
import verifyToken from "../views/middlewares";
import { verifyAdmin } from "../views/middlewares";
import { ParsedQs } from "qs";
import DeleteRequest from "../Models/DeleteRequest.model.js";
import { AuthenticatedRequest } from "../types";
import Event from "../Models/Event.model.js";

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

router.get("/admin", verifyAdmin, async (req, res) => {
  res.json({ message: "Welcome to the admin page" });
});

/**
 * GET /api/admin/users/admin
 * Returns paginated list of users for admin panel
 */
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
const getEventsAdmin: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: not admin" });
    }

    const { page = "1", limit = "5", search = "" } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 5);

    const query = {
      title: { $regex: search, $options: "i" },
    };

    const totalEvents = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalEvents / limitNumber);

    const events = await Event.find(query)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    res.json({
      events,
      totalPages,
      totalEvents,
      currentPage: pageNumber,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

router.get("/events/admin", verifyToken, getEventsAdmin);

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

export default router;
