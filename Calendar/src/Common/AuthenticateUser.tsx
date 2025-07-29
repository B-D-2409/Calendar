// Authenticated.tsx
import { useContext, ReactNode, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { AuthContext, AuthContextType } from "./AuthContext";
import { toast } from "react-toastify";

/**
 * Props for the Authenticated component.
 * @typedef {Object} AuthenticatedProps
 * @property {ReactNode} children - The content to display if the user is authenticated.
 */
interface AuthenticatedProps {
    children: ReactNode;
}


/**
 * A wrapper component that protects a route by requiring authentication.
 * If the user is not logged in, redirects them to the login page and shows a warning toast.
 *
 * @component
 * @param {AuthenticatedProps} props - The component props.
 * @returns {JSX.Element} The protected content or a redirect to login.
 */
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

    return <>{children}</>;
}
