import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

/**
 * Extended JWT payload interface with custom user properties.
 * @interface CustomJwtPayload
 * @extends JwtPayload
 */
export interface CustomJwtPayload extends JwtPayload {
  /**
   * User's unique identifier.
   * @type {string | undefined}
   */
  id?: string;

  /**
   * User's username.
   * @type {string | undefined}
   */
  username?: string;

  /**
   * User's role (e.g., admin, user).
   * @type {string | undefined}
   */
  role?: string;
}

/**
 * Express request interface extended to include an authenticated user.
 * @interface AuthenticatedRequest
 * @extends Request
 */
export interface AuthenticatedRequest extends Request {
  /**
   * Authenticated user payload attached to the request.
   * @type {CustomJwtPayload | undefined}
   */
  user?: CustomJwtPayload;
}