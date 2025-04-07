import { useState } from 'react';
import useAuthContext from './useAuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../api/axios";

export const useVirtoLogin = () => {
    const { dispatch } = useAuthContext();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const navigate = useNavigate();

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const payload = {
                username: email,
                password: password
            };

            const loginResponse = await axiosInstance.post('/api/login', payload);

            if (loginResponse.status === 200 && loginResponse.data.token) {
                const token = loginResponse.data.token;
                
                // Always assign inergy_admin role for Virto users
                const roles = ['inergy_admin']; 
                
                // Store authentication data
                localStorage.setItem('virtoToken', token);
                localStorage.setItem('authMethod', 'virto');
                localStorage.setItem('virtoUsername', email);
                localStorage.setItem('virtoEmail', email);
                localStorage.setItem('virtoRoles', JSON.stringify(roles));

                // Update auth context
                dispatch({ 
                    type: 'LOGIN', 
                    payload: { 
                        user: email,
                        roles: roles,
                        authMethod: 'virto',
                        token: token 
                    }
                });

                // Update axios default headers
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setResponse('Login successful');
                setIsLoading(false);

                // Force a page reload to update the menu
                window.location.href = '/'; // Using href instead of navigate to ensure complete reload
                return true;
            }
            
            throw new Error('Invalid response format');

        } catch (err) {
            console.error('Login error:', err);
            
            let errorMessage = 'Login failed';
            if (err.response) {
                // Handle specific error cases
                if (err.response.status === 401) {
                    errorMessage = 'Invalid credentials';
                } else if (err.response.status === 422) {
                    errorMessage = 'Invalid email or password format';
                } else if (err.response.data?.detail) {
                    errorMessage = err.response.data.detail;
                }
            }
            
            setError(errorMessage);
            setResponse('Login failed');
            setIsLoading(false);
            return false;
        }
    };

    return { login, error, isLoading, response };
};
