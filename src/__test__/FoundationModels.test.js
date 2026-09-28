import React from 'react';
import {render, screen} from "@testing-library/react";
import my_keycloak from "../Keycloak";
import {ReactKeycloakProvider} from "@react-keycloak/web";
import {BrowserRouter} from "react-router-dom";
import {AuthContextProvider} from "../context/AuthContext";

import FoundationModels from "../pages/FoundationModels";

// To run the tests, comment and uncomment the needed lines in the main component
// Guidance is offered in the component with comments
it('renders Foundation Models section', () => {
    render(
        <ReactKeycloakProvider authClient={my_keycloak} initOptions={{onLoad: 'login-required'}}>
            <React.StrictMode>
                <BrowserRouter>
                    <AuthContextProvider>
                        <FoundationModels/>
                    </AuthContextProvider>
                </BrowserRouter>
            </React.StrictMode>
        </ReactKeycloakProvider>
    )
    const foundationModelsSection = screen.getByTestId('foundationModelsSection')
    expect(foundationModelsSection).toBeInTheDocument();
})
