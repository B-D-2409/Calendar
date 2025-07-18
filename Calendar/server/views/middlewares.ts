import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, CustomJwtPayload } from "../types"; 

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

    req.user = decoded as CustomJwtPayload; 
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
    console.log("No token provided");
    res.status(401).json({ message: "Access denied" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;

    console.log("Decoded token in verifyAdmin:", decoded);

    if (!decoded || decoded.role !== "admin") {
      console.log("User is not admin or role missing");
      res.status(403).json({ message: "Admins only" });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(400).json({ message: "Invalid token" });
  }
}
