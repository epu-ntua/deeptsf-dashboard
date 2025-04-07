import axios from "axios";
import {Route, Routes} from 'react-router-dom';

import {useKeycloak} from "@react-keycloak/web";

import Layout from "./components/layout/Layout";
import Homepage from "./pages/Homepage";
// import SignIn from "./pages/auth/SignIn";
import UserProfile from "./pages/UserProfile";
import RequireAuth from "./components/RequireAuth";
// import RequireNotAuth from "./components/RequireNotAuth";

import {ThemeProvider, createTheme} from '@mui/material/styles';
import CodelessForecast from "./pages/CodelessForecast";
import ExperimentTracking from "./pages/ExperimentTracking";
import SystemMonitoring from "./pages/SystemMonitoring";

// Load environment variables
const primary = '#0047BB'; // '#97A94D'; // fallback if env var isn't set
const secondary = '#41B6E6'; // '#B2C561';

// Dashboard theme setup here
const theme = createTheme({
    palette: {
        primary: {
            main: primary
        },
        secondary: {
            main: secondary
        },
        barBackground: {
            main: primary
        },
        success: {
            main: '#4DAF4A'
        },
        warning: {
            main: '#F2C94C'
        },
        error: {
            main: '#EB5757'
        },
        info: {
            main: '#56CCF2'
        },
    },
});

function App() {
    const {keycloak} = useKeycloak();
    
    // Remove CORS headers from default axios config
    axios.defaults.baseURL = process.env.REACT_APP_BACKEND_BASE_URL;
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // Set authorization header based on authentication method
    if (keycloak.authenticated && keycloak.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
        // Store Keycloak token in localStorage for consistent access across the app
        localStorage.setItem('keycloakToken', keycloak.token);
        localStorage.setItem('authMethod', 'keycloak');
    } else {
        const virtoToken = localStorage.getItem('virtoToken');
        const authMethod = localStorage.getItem('authMethod');
        if (authMethod === 'virto' && virtoToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${virtoToken}`;
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <div className="App">
                <Layout>
                    <Routes>
                        <Route path="/" element={<Homepage/>}/>

                         {/* Routes not accessible to logged-out users */}
                        <Route element={<RequireAuth/>}>
                            <Route path="/user/profile" element={<UserProfile/>}/>
                        </Route>

                        <Route element={<RequireAuth/>}>
                            <Route path="/codeless-forecast" element={<CodelessForecast/>}/>
                        </Route>

                        <Route element={<RequireAuth/>}>
                            <Route path="/monitoring" element={<SystemMonitoring/>}/>
                        </Route>

                        <Route element={<RequireAuth/>}>
                            <Route path="/experiment-tracking" element={<ExperimentTracking/>}/>
                        </Route>
                    </Routes>
                </Layout>
            </div>
        </ThemeProvider>
    );
}

export default App;
