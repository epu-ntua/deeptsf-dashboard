import React, { useState, useEffect } from 'react';
import { useVirtoLogin } from '../hooks/useVirtoLogin';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Loading from './layout/Loading';
import Alert from '@mui/material/Alert';

const VirtoLoginForm = () => {
    const { login, error, isLoading, response } = useVirtoLogin();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginMessage, setLoginMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!email || !password) {
            setLoginMessage('Please fill in all fields');
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setLoginMessage('Please enter a valid email address');
            return;
        }

        const success = await login(email, password);
        if (success) {
            setLoginMessage('Login successful. Redirecting...');
            // Clear form
            setEmail('');
            setPassword('');
        }
    };

    useEffect(() => {
        if (response) {
            setLoginMessage(response);
        }
    }, [response]);

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, px: 4 }}>
            <Typography variant="h6">DeployAI Login</Typography>
            {loginMessage === 'Login successful' ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {loginMessage}
                </Alert>
            ) : (
                <>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {isLoading && (
                        <Box mt={3} display="flex" justifyContent="center">
                            <Loading />
                        </Box>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </>
            )}
        </Box>
    );
};

export default VirtoLoginForm;
