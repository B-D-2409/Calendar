import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, CustomJwtPayload } from "../types"; 

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
/**
 * Middleware to verify a JWT token from the Authorization header.
 * If valid, attaches the decoded token payload to `req.user`.
 * Responds with 401 if no token provided or 403 if token is invalid.
 * 
 * @param {AuthenticatedRequest} req - Express request object with optional user property
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
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

/**
 * Middleware to verify a JWT token and check if the user has an admin role.
 * Attaches the decoded token payload to `req.user` if valid and authorized.
 * Responds with 401 if no token, 403 if user is not admin, and 400 if token is invalid.
 * 
 * @param {AuthenticatedRequest} req - Express request object with optional user property
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
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
