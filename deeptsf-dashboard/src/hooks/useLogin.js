import {useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from 'axios';
import qs from 'qs';
import useAuthContext from "./useAuthContext";

export const useLogin = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(null);
    const {dispatch} = useAuthContext();

    const login = (username, password) => {
        setError(false);
        setIsLoading(true);

        let credentials = qs.stringify({
            client_id: 'ntua-test-client',
            username,
            password,
            grant_type: 'password'
        });

        // Log the user in
        axios.post('https://oblachek.eu:8443/realms/inergy/protocol/openid-connect/token', credentials, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        })
            .then(response => {
                const accessToken = response.data?.access_token;
                
                // Store token in localStorage for axios
                localStorage.setItem('keycloakToken', accessToken);
                localStorage.setItem('authMethod', 'keycloak');
                localStorage.setItem('user', JSON.stringify({username, accessToken}));

                // Fetch user's roles
                axios.post('https://oblachek.eu:8443/realms/inergy/protocol/openid-connect/userinfo', null, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Bearer ' + accessToken
                    },
                })
                    .then(response => {
                        const roles = response.data.realm_access.roles;
                        
                        // Save roles to local storage as JSON string
                        localStorage.setItem('roles', JSON.stringify(roles));

                        // Update auth context
                        dispatch({
                            type: 'LOGIN',
                            payload: {
                                user: {username, accessToken}, 
                                roles: roles,
                                authMethod: 'keycloak',
                                token: accessToken
                            }
                        });

                        // Update axios default header
                        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                        setIsLoading(false);
                        navigate('/');
                    })
                    .catch(error => {
                        console.error('Error fetching user info:', error);
                        setError(true);
                        setIsLoading(false);
                    });
            })
            .catch(error => {
                console.error('Login error:', error);
                setError(true);
                setIsLoading(false);
            });
    };

    return {login, isLoading, error};
};