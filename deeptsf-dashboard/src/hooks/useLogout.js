import { useNavigate } from 'react-router-dom';
import useAuthContext from "./useAuthContext";
import axiosInstance from "../api/axios";
import axios from 'axios';
import { useKeycloak } from "@react-keycloak/web";

export const useLogout = () => {
    const { dispatch } = useAuthContext();
    const navigate = useNavigate();
    const { keycloak } = useKeycloak();

    const logout = async () => {
        try {
            const authMethod = localStorage.getItem('authMethod');
            
            // Handle different logout methods based on authentication type
            if (authMethod === 'virto') {
                // Call Virto logout endpoint with axiosInstance
                await axiosInstance.post('/api/logout');
            } else if (authMethod === 'keycloak') {
                // For Keycloak, we'll use the keycloak.logout() after clearing localStorage
                // This is handled after the localStorage cleanup
            }

            // Clear all auth-related items from localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('roles');
            localStorage.removeItem('virtoToken');
            localStorage.removeItem('keycloakToken');
            localStorage.removeItem('virtoUsername');
            localStorage.removeItem('virtoEmail');
            localStorage.removeItem('virtoRoles');
            localStorage.removeItem('authMethod');

            // Clear any axios default headers
            delete axios.defaults.headers.common['Authorization'];
            delete axiosInstance.defaults.headers.common['Authorization'];

            // Dispatch logout action
            dispatch({ type: 'LOGOUT' });

            // If Keycloak was used, also do Keycloak logout
            if (authMethod === 'keycloak' && keycloak.authenticated) {
                // Use a redirect URL to the homepage
                const logoutOptions = { redirectUri: window.location.origin };
                keycloak.logout(logoutOptions);
            } else {
                // For Virto or if Keycloak is not authenticated, just navigate
                navigate('/');
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Even if the logout request fails, clear local storage and redirect
            localStorage.clear();
            navigate('/');
        }
    };

    return { logout };
};