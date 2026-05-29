import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Spinner from "./Spinner";

const ProtectedRoute = () => {
  const { isAuthenticated, fetchMe, user } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (!user) {
        await fetchMe();
      }
      setChecking(false);
    };
    verifyUser();
  }, [fetchMe, user]);

  if (checking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dark-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
