import Keycloak from "keycloak-js";

const createKeycloakInstance = (enabled) => {
    if (enabled) {
        console.log(process.env.REACT_APP_KEYCLOAK_REALM)

        const keycloakInstance = new Keycloak({
            realm: process.env.REACT_APP_KEYCLOAK_REALM,
            url: process.env.REACT_APP_KEYCLOAK_URL,
            clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID
        });

        // Add event listeners for token refresh and expiration
        keycloakInstance.onTokenExpired = () => {
            console.log('Keycloak token expired');
            keycloakInstance.updateToken(30).then(refreshed => {
                if (refreshed) {
                    console.log('Token was successfully refreshed');
                    localStorage.setItem('keycloakToken', keycloakInstance.token);
                } else {
                    console.log('Token is still valid');
                }
            }).catch(() => {
                console.error('Failed to refresh token, logging out...');
                keycloakInstance.logout();
            });
        };

        return keycloakInstance;
    } else {
        // Create a dummy Keycloak instance that doesn't do authentication
        const dummyKeycloak = {
            init: () => Promise.resolve(),
            login: () => {},
            logout: () => {},
            authenticated: false,
            realmAccess: { roles: [] },
            token: null,
            onTokenExpired: () => {},
            updateToken: () => Promise.resolve(false),
            // Add other Keycloak methods you may use as empty functions
        };

        // Manually set initialized to true
        dummyKeycloak.initialized = true;

        return dummyKeycloak;
    }
};

const shouldAuthenticate = process.env.REACT_APP_AUTH === "True";
console.log(shouldAuthenticate)
const my_keycloak = createKeycloakInstance(shouldAuthenticate);

export default my_keycloak;