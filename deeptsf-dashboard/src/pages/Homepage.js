import React from 'react';

import HomepageItemFullWidth from "../components/homepage/HomepageItemFullWidth";
import {servicesHomepage} from "../components/homepage/servicesHomepage";
import {useKeycloak} from "@react-keycloak/web";
import LandingPage from './LandingPage'; // Import the new LandingPage component

const Homepage = () => {
    const {keycloak, initialized} = useKeycloak()

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

    if (!initialized) {
        return <div>Loading...</div>;
    }

    return (
        <div data-testid={"homepageOverall"}>
            {keycloak.authenticated ? (
                servicesHomepage.map((service, index) => (
                    <div data-testid={"homepageItem"}>
                        <HomepageItemFullWidth title={service.title} description={service.description} icon={service.icon}
                                               image={service.image} link={service.link} index={index} key={service.id}
                                               showLink={initialized ? findCommonElement(keycloak.realmAccess.roles, service.roles) : false}
                        />
                    </div>
                ))
            ) : (
                <LandingPage /> // Render the landing page for non-authenticated users
            )}
        </div>
    );
}

export default Homepage;