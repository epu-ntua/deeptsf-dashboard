import React from 'react';

import HomepageItemFullWidth from "../components/homepage/HomepageItemFullWidth";
import {servicesHomepage} from "../components/homepage/servicesHomepage";
import {useKeycloak} from "@react-keycloak/web";
import LandingPage from './LandingPage'; // Import the new LandingPage component

const Homepage = () => {
    const {keycloak, initialized} = useKeycloak();
    // Check if authentication is required based on env variable
    const authenticationEnabled = process.env.REACT_APP_AUTH === "True";
    
    // Also check Virto authentication
    const virtoAuthenticated = localStorage.getItem('authMethod') === 'virto' && localStorage.getItem('virtoToken');

    function findCommonElement(array1, array2) {
        // Loop for array1
        for (let i = 0; i < array1.length; i++) {
            // Loop for array2
            for (let j = 0; j < array2.length; j++) {
                // Compare the element of each and every element from both of the arrays
                if (array1[i] === array2[j]) {
                    // Return if common element found
                    return true;
                }
            }
        }
        // Return if no common element exist
        return false;
    }

    // Show loading only when authentication is enabled and still initializing
    if (authenticationEnabled && !initialized) {
        return <div>Loading...</div>;
    }

    return (
        <div data-testid={"homepageOverall"}>
            {(!authenticationEnabled || keycloak.authenticated || virtoAuthenticated) ? (
                servicesHomepage.map((service, index) => (
                    <div data-testid={"homepageItem"} key={service.id || index}>
                        <HomepageItemFullWidth 
                            title={service.title} 
                            description={service.description} 
                            icon={service.icon}
                            image={service.image} 
                            link={service.link} 
                            index={index} 
                            showLink={
                                // When authentication is disabled, show all links
                                !authenticationEnabled || 
                                // For Keycloak users, check roles
                                (initialized && keycloak.authenticated && findCommonElement(keycloak.realmAccess.roles, service.roles)) ||
                                // For Virto users, assume they can access all services (they have inergy_admin role)
                                virtoAuthenticated
                            }
                        />
                    </div>
                ))
            ) : (
                <LandingPage /> // Render the landing page for non-authenticated users when auth is required
            )}
        </div>
    );
}

export default Homepage;