import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequest } from "../types"; // adjust path to your new types file

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";

export default function verifyToken(
  req: AuthenticatedRequest, // use your extended request here
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

    req.user = decoded as JwtPayload;
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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (decoded && (decoded as any).role !== "admin") {
      res.status(403).json({ message: "Admins only" });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}
