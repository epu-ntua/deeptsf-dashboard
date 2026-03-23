import {useKeycloak} from "@react-keycloak/web";

const useAuth = () => {
    const {keycloak} = useKeycloak();

    const handleLogin = () => {
        keycloak.login();
    };

    return {keycloak, handleLogin};
};

export default useAuth;