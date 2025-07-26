// Authenticated.tsx
import { useContext, ReactNode, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { AuthContext, AuthContextType } from "./AuthContext";
// import Verify from "./Verify";
import { toast } from "react-toastify";

interface AuthenticatedProps {
    children: ReactNode;
}

export default function Authenticated({ children }: AuthenticatedProps) {
    const { user } = useContext(AuthContext) as AuthContextType;
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            toast.warn("You need to be logged in to view this page.");

        }
    }, [user])

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    //   if (!user.emailVerified) {
    //     return <Verify />;
    //   }

    return <>{children}</>;
}
