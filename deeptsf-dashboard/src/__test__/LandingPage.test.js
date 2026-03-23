// FILE: deeptsf-dashboard/src/__test__/LandingPage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import LandingPage from '../pages/LandingPage';
import { servicesHomepage } from '../components/homepage/servicesHomepage';

jest.mock('../hooks/useAuth', () => ({
    __esModule: true,
    default: () => ({
        handleLogin: jest.fn(),
    }),
}));

describe('LandingPage', () => {
    test('renders LandingPage component', () => {
        render(
            <ThemeProvider theme={theme}>
                <LandingPage />
            </ThemeProvider>
        );

        // Check if the hero section is rendered
        expect(screen.getByText(/DeepTSF/i)).toBeInTheDocument();
        expect(screen.getByText(/A machine learning operations \(MLOps\) framework for time series forecasting./i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Explore/i })).toBeInTheDocument();

        // Check if the servicesHomepage items are rendered
        servicesHomepage.forEach(service => {
            expect(screen.getByText(service.title)).toBeInTheDocument();
            expect(screen.getByText(service.description)).toBeInTheDocument();
        });
    });
});