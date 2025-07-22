import express from 'express';
import verifyToken from '../views/middlewares';
import UserModel from '../Models/User.model';
import { RequestHandler } from 'express';
const router = express.Router();

// Get all users without password field
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await UserModel.find({}, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by username
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

export default router;
