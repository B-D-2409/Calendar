import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface CustomJwtPayload extends JwtPayload {
  id?: string;
  username?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: CustomJwtPayload;
}
