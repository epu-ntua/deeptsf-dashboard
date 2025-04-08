import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import useAuthContext from "../hooks/useAuthContext";
import axiosInstance from '../api/axios';

const RequireAuth = () => {
    const { keycloak } = useKeycloak();
    const location = useLocation();
    const { user } = useAuthContext();
    
    // Check if authentication is required based on env variable
    const authenticationEnabled = process.env.REACT_APP_AUTH === "True";
    
    // Check both authentication methods
    const keycloakAuthenticated = keycloak.authenticated;
    const virtoAuthenticated = localStorage.getItem('authMethod') === 'virto' && localStorage.getItem('virtoToken');
    
    useEffect(() => {
        // Set up the appropriate token in axios headers based on the authentication method
        if (keycloakAuthenticated && keycloak.token) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
        } else if (virtoAuthenticated) {
            const virtoToken = localStorage.getItem('virtoToken');
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${virtoToken}`;
        }
    }, [keycloakAuthenticated, virtoAuthenticated, keycloak.token]);

    // If authentication is disabled, allow access without checking auth status
    if (!authenticationEnabled) {
        return <Outlet />;
    }
    
    // Otherwise, check authentication
    if (keycloakAuthenticated || virtoAuthenticated) {
        return <Outlet />;
    } else {
        // Redirect to homepage if not authenticated
        return <Navigate to="/" state={{ from: location }} replace />;
    }
};

export default RequireAuth;