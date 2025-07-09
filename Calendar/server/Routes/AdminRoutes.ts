import express, { RequestHandler, Response, Request, NextFunction } from "express";
import User from "../Models/User.model";
import verifyToken from "../views/middlewares";
import { verifyAdmin } from "../views/middlewares";
import { ParsedQs } from "qs";
import DeleteRequest from "../Models/DeleteRequest.model";
import { AuthenticatedRequest } from "../types";
const router = express.Router();
function getQueryParamAsString(
    param: string | ParsedQs | (string | ParsedQs)[] | undefined,
    defaultValue: string
): string {
    if (Array.isArray(param)) {
        // Convert (string | ParsedQs)[] to string if first element is string
        const first = param[0];
        return typeof first === "string" ? first : defaultValue;
    }
    if (typeof param === "string") {
        return param;
    }
    return defaultValue;
}



const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";

router.get("/admin", verifyAdmin, async (req, res) => {
    res.json({ message: "Welcome to the admin page" });
});

router.get("/users/admin", verifyToken, async (req, res) => {
    try {
        const pageStr = getQueryParamAsString(req.query.page, "1");
        const limitStr = getQueryParamAsString(req.query.limit, "5");

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
        res.status(500).json({ error: (err as Error).message });
    }
});

router.post("/block/:id", verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
        res.json({ message: "User blocked" });
    } catch (err) {
        res.status(500).json({ message: "Failed to block user" });
    }
});

router.post("/unblock/:id", verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
        res.json({ message: "User unblocked" });
    } catch (err) {
        res.status(500).json({ message: "Failed to unblock user" });
    }
});

const deleteUserHandler: RequestHandler = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            res.status(404).json({ message: "User not found" });
            return; // ensure no further execution
        }
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete user" });
    }
};
router.delete("/delete/:id", verifyAdmin, deleteUserHandler);



const requestDeleteUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const existingRequest = await DeleteRequest.findOne({
            userId: req.user!.id,
        });

        if (existingRequest) {
            res.status(400).json({ message: "Delete request already exists" });
            return;
        }

        const newRequest = new DeleteRequest({
            userId: req.user!.id,
            username: req.user!.username,
            reason: req.body.reason || "User requested account deletion",
        });

        await newRequest.save();
        res.status(201).json({ message: "Delete request submitted" });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

router.post("/request-delete", verifyToken, requestDeleteUser);

const getDeleteRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.findById(req.user!.id);
        if (user?.role !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return
        }

        const requests = await DeleteRequest.find().populate(
            "userId",
            "username email"
        );
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

router.get("/delete-requests", verifyAdmin, getDeleteRequest)
export default router;