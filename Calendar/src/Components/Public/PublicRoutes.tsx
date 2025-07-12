import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { user, loading, isLoggedIn } = useContext(AuthContext) as AuthContextType;
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isLoggedIn) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
