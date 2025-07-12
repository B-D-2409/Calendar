import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
interface ProtectedOnlyRouteProps {
    children: React.ReactNode;
}
const ProtectedRoute: React.FC<ProtectedOnlyRouteProps> = ({ children }) => {
    const { user, loading, isLoggedIn } = useContext(AuthContext) as AuthContextType;
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>; // Or your custom loading component
    }

    if (!isLoggedIn) {
        return <Navigate to="/public" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
