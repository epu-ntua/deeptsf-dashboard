import React from 'react';
import {render, screen} from "@testing-library/react";
import my_keycloak from "../Keycloak";
import {ReactKeycloakProvider} from "@react-keycloak/web";
import {BrowserRouter} from "react-router-dom";
import {AuthContextProvider} from "../context/AuthContext";

import Homepage from "../pages/Homepage";

it('renders the homepage', async () => {
    render(
        <ReactKeycloakProvider authClient={my_keycloak} initOptions={{ onLoad: 'login-required' }}>
            <React.StrictMode>
                <BrowserRouter>
                    <AuthContextProvider>
                        <Homepage/>
                    </AuthContextProvider>
                </BrowserRouter>
            </React.StrictMode>
        </ReactKeycloakProvider>
    )
    const homepageOverall = await screen.findByTestId('homepageOverall')
    expect(homepageOverall).toBeInTheDocument();
})

it('renders 5 full-width items in the homepage', async () => {
    render(
        <ReactKeycloakProvider authClient={my_keycloak} initOptions={{ onLoad: 'login-required' }}>
            <React.StrictMode>
                <BrowserRouter>
                    <AuthContextProvider>
                        <Homepage/>
                    </AuthContextProvider>
                </BrowserRouter>
            </React.StrictMode>
        </ReactKeycloakProvider>
    )
    const homepageItem = await screen.findAllByTestId('homepageItem')
    expect(homepageItem.length).toBe(5);
})