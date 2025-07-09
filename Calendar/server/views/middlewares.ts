import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, CustomJwtPayload } from "../types"; // import CustomJwtPayload here

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";

export default function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ msg: "No token provided" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ msg: "Invalid token" });
      return;
    }

    req.user = decoded as CustomJwtPayload; // <-- cast here
    next();
  });
}

export function verifyAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload; // <-- cast here

    if (!decoded || decoded.role !== "admin") {
      res.status(403).json({ message: "Admins only" });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}
