import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface CustomJwtPayload extends JwtPayload {
  id?: string;          // user id stored in token
  username?: string;    // username stored in token
  role?: string;        // role (like 'admin')
}

export interface AuthenticatedRequest extends Request {
  user?: CustomJwtPayload;
}
