import {useContext} from "react";
import {AuthContext} from "../context/AuthContext";

const useAuthContext = () => {
    const { state, dispatch } = useContext(AuthContext);

    const login = (user, roles, authMethod, token) => {
        localStorage.setItem('authMethod', authMethod);
        dispatch({ type: 'LOGIN', payload: { user, roles, authMethod, token } });
    };

    const virtoLogin = (user, roles, authMethod, token) => {
        localStorage.setItem('authMethod', authMethod);
        dispatch({ type: 'VIRTO_LOGIN', payload: { user, roles, authMethod, token } });
    };

    return { ...state, login, virtoLogin, dispatch };
};

export default useAuthContext;