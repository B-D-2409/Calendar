// Authenticated.tsx
import { useContext, ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { AuthContext, AuthContextType } from "./AuthContext";
// import Verify from "./Verify";

interface AuthenticatedProps {
  children: ReactNode;
}

export default function Authenticated({ children }: AuthenticatedProps) {
  const { user } = useContext(AuthContext) as AuthContextType;
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

//   if (!user.emailVerified) {
//     return <Verify />;
//   }

  return <>{children}</>;
}
