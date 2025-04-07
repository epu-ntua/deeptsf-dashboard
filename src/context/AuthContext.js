import {createContext, useReducer, useEffect} from "react";

export const AuthContext = createContext()

export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { 
                user: action.payload.user, 
                roles: action.payload.roles, 
                authMethod: action.payload.authMethod, 
                token: action.payload.token 
            };
        case 'LOGOUT':
            return { user: null, roles: null, authMethod: null, token: null };
        default:
            return state;
    }
}

export const AuthContextProvider = ({children}) => {
    const [state, dispatch] = useReducer(authReducer, {
        user: null, roles: null, authMethod: null, token: null
    })

    useEffect(() => {
        // Check for user authentication data in local storage
        const authMethod = localStorage.getItem('authMethod');
        
        // Handle Keycloak auth
        if (authMethod === 'keycloak') {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const roles = JSON.parse(localStorage.getItem('roles') || 'null');
            const token = localStorage.getItem('keycloakToken');
            
            if (user && token) {
                dispatch({ 
                    type: 'LOGIN', 
                    payload: { 
                        user, 
                        roles, 
                        authMethod: 'keycloak', 
                        token 
                    } 
                });
            }
        } 
        // Handle Virto auth
        else if (authMethod === 'virto') {
            const username = localStorage.getItem('virtoUsername');
            const email = localStorage.getItem('virtoEmail');
            const roles = JSON.parse(localStorage.getItem('virtoRoles') || '[]');
            const token = localStorage.getItem('virtoToken');
            
            if (username && token) {
                dispatch({ 
                    type: 'LOGIN', 
                    payload: { 
                        user: {username, email}, 
                        roles, 
                        authMethod: 'virto', 
                        token 
                    } 
                });
            }
        }
    }, [])

    console.log('AuthContext state:', state)

    return (
        <AuthContext.Provider value={{...state, dispatch}}>
            {children}
        </AuthContext.Provider>
    )
}

