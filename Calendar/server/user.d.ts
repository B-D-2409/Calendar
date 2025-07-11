import { UserDocument } from "./Models/User.model";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}