import React, {useEffect, useState, useMemo} from 'react';
import {Link, useNavigate, useLocation, Navigate} from "react-router-dom";
// import useAuthContext from "../../hooks/useAuthContext";
import {useLogout} from "../../hooks/useLogout";
import { useVirtoLogin } from "../../hooks/useVirtoLogin";
import axios from 'axios';

import {styled, useTheme} from '@mui/material/styles';
import clsx from 'clsx';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UpdateIcon from '@mui/icons-material/Update';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import SignedOutLinks from "./SignedOutLinks";
import SignedInLinks from "./SignedInLinks";
import FooterContent from "../FooterContent";
import MenuButton from "./MenuButton";

import {appbarMenuButtonItems} from "../../appbarMenuButtonItems";
import {useKeycloak} from "@react-keycloak/web";
import VirtoLoginForm from '../VirtoLoginForm';

const drawerWidth = 260;

const useStyles = {
    active: {
        background: 'linear-gradient(45deg, #f4f4f4 30%, #f4f4f4 90%)',
    },
    nested: {
        paddingLeft: '30px !important',
    },
    avatar: {
        marginLeft: 3, marginTop: 1, color: 'white', '&:hover': {
            color: '#1A88C9',
        }
    }
};

const Main = styled('main', {shouldForwardProp: (prop) => prop !== 'open'})(({theme, open}) => ({
    flexGrow: 1, // padding: theme.spacing(3),
    paddingTop: theme.spacing(3), paddingBottom: theme.spacing(3), transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen,
    }), marginLeft: `-${drawerWidth}px`, ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut, duration: theme.transitions.duration.enteringScreen,
        }), marginLeft: 0,
    }),
}),);

const AppBar = styled(MuiAppBar, {shouldForwardProp: (prop) => prop !== 'open',})(({theme, open}) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen,
    }), background: theme.palette.barBackground.main, ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut, duration: theme.transitions.duration.enteringScreen,
        }),
    }), // backgroundColor: '#111'
    // ...(!open && {
    //     width: `calc(100% - 60px)`,
    //     marginLeft: `${drawerWidth}px`,
    //     transition: theme.transitions.create(['margin', 'width'], {
    //         easing: theme.transitions.easing.easeOut,
    //         duration: theme.transitions.duration.enteringScreen,
    //     }),
    // }),
}));

const Footer = styled(MuiAppBar, {shouldForwardProp: (prop) => prop !== 'open',})(({theme, open}) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen,
    }),

    ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut, duration: theme.transitions.duration.enteringScreen,
        }),
    }), background: theme.palette.barBackground.main, boxShadow: 5
}));

const DrawerHeader = styled('div')(({theme}) => ({
    display: 'flex', alignItems: 'center', padding: theme.spacing(0, 1), // necessary for content to be below app bar
    ...theme.mixins.toolbar, minHeight: '40px !important', justifyContent: 'flex-end',
}));

export default function Layout({children}) {
    const {keycloak, initialized} = useKeycloak();
    const { logout } = useLogout();
    const { login: virtoLogin, response: virtoResponse, error: virtoError } = useVirtoLogin();
    const classes = useStyles;
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = useMemo(() => [{text: 'Homepage', icon: <HomeOutlinedIcon color="primary"/>, path: "/",}], []);

    const [menu, setMenu] = useState(menuItems);
    const [showVirtoLoginForm, setShowVirtoLoginForm] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [virtoLoginSuccess, setVirtoLoginSuccess] = useState(false);

    const handleSignOut = async () => {
        // The useLogout hook will handle both authentication methods
        await logout();
        setMenu(menuItems);
        setIsAuthenticated(false);
        setVirtoLoginSuccess(false);
    };

    const handleVirtoLogin = () => {
        const username = prompt("Enter your DeployAI username:");
        const password = prompt("Enter your DeployAI password:");
        virtoLogin(username, password).then(() => {
            console.log("DeployAI Login successful");
            setVirtoLoginSuccess(true);
        });
    };

    const handleVirtoLoginClick = () => {
        setShowVirtoLoginForm(!showVirtoLoginForm);
    };

    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    const authenticationEnabled = process.env.REACT_APP_AUTH === "True";

    useEffect(() => {
        // Check authentication status and update state
        const authMethod = localStorage.getItem('authMethod');
        const keycloakAuth = keycloak?.authenticated;
        const virtoAuth = authMethod === 'virto' && localStorage.getItem('virtoToken');
        
        if (keycloakAuth || virtoAuth) {
            setIsAuthenticated(true);
            setShowVirtoLoginForm(false);
        } else {
            setIsAuthenticated(false);
        }
        
        // Build menu based on roles
        let roles = [];
        
        // Handle Virto authentication
        if (authMethod === 'virto') {
            // Always use inergy_admin role for Virto users
            roles = ['inergy_admin'];
            
            // Set Virto token for axios requests
            const virtoToken = localStorage.getItem('virtoToken');
            if (virtoToken) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${virtoToken}`;
            }
        } 
        // Handle Keycloak authentication
        else if (keycloakAuth) {
            // Get roles directly from Keycloak
            roles = keycloak.realmAccess?.roles || [];
            
            // Set Keycloak token for axios requests
            if (keycloak.token) {
                localStorage.setItem('keycloakToken', keycloak.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
            }
        }

        const updatedMenuItems = [...menuItems];

        // Add menu items based on roles
        if ((roles.includes('data_scientist') || roles.includes('inergy_admin')) || !authenticationEnabled) {
            updatedMenuItems.push({
                text: 'Codeless Forecasting Pipeline',
                icon: <UpdateIcon color="primary"/>,
                path: "/codeless-forecast"
            });
        }

        if ((roles.includes('energy_engineer') || roles.includes('inergy_admin')) || !authenticationEnabled) {
            updatedMenuItems.push({
                text: 'Experiment Tracking',
                icon: <QueryStatsIcon color="primary"/>,
                path: "/experiment-tracking"
            });
        }

        if ((roles.includes('inergy_admin')) || !authenticationEnabled) {
            updatedMenuItems.push({
                text: 'System Monitoring',
                icon: <MonitorHeartIcon color="primary"/>,
                path: "/monitoring"
            });

            const dagsterEndpoint = process.env.REACT_APP_DAGSTER_ENDPOINT_URL;
            if (dagsterEndpoint && dagsterEndpoint !== "") {
                updatedMenuItems.push({
                    text: 'Dagster Dashboard',
                    icon: <img src="/images/dagster_logo.jpg" alt="" width={'25px'} style={{borderRadius: '50%'}}/>,
                    path: location.pathname + ' ',
                    link: process.env.REACT_APP_DAGSTER_ENDPOINT_URL
                });
            }
        }

        setMenu(updatedMenuItems);
    }, [keycloak.authenticated, initialized, virtoLoginSuccess, authenticationEnabled, location.pathname, menuItems, keycloak.token, keycloak.realmAccess?.roles]);

    // Process JWT from URL parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const jwtToken = urlParams.get('jwt');
        if (!jwtToken) {
            return;
        }
        
        console.log('JWT Token from URL:', jwtToken);
        axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/api/auth`, { jwt: jwtToken }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true
        })
        .then(response => {
            console.log('Authentication response:', response);
            const data = response.data;
            // Extract token from data.token; if missing, parse from data.url query parameter.
            let tokenValue = data.token;
            if (!tokenValue && data.url) {
                tokenValue = new URL(data.url).searchParams.get('jwt');
            }
            if (!tokenValue) {
                console.error('JWT token not found in response data', data);
                return;
            }
            // Fallback to user email if username is 'unknown' or missing.
            let username = data.user?.username;
            if (!username || username === 'unknown') {
                username = data.user?.email || 'unknown';
            }
            localStorage.setItem('virtoToken', tokenValue);
            localStorage.setItem('authMethod', 'virto');
            localStorage.setItem('virtoUsername', username);
            localStorage.setItem('virtoEmail', data.user?.email || '');
            const roles = [...(data.user?.roles || []), 'inergy_admin'];
            localStorage.setItem('virtoRoles', JSON.stringify(roles));
            setIsAuthenticated(true);
            console.log('User authenticated:', username);
            window.location.href = '/user/profile';
        })
        .catch(error => {
            console.error('Error during authentication:', error);
            if (error.response) {
                console.error('Error response data:', error.response.data);
            }
        });
    }, []);

    return (
        <React.Fragment>
            <Box sx={{display: 'flex', minHeight: `calc(100vh - 60px)`}}>
                <CssBaseline/>
                <AppBar position="fixed" open={drawerOpen}>
                    <Toolbar>
                        <IconButton
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            edge="start"
                            sx={{mr: 2, color: 'white', ...(drawerOpen && {display: 'none'})}}>
                            <MenuIcon/>
                        </IconButton>
                        <h3 style={{color: 'white'}}>DeepTSF</h3>
                        {keycloak.authenticated === true || localStorage.getItem('authMethod') === 'virto' ? (
                            <React.Fragment>
                                <Typography style={{
                                    marginLeft: 'auto',
                                    color: 'white'
                                }}>
                                    Welcome, {keycloak.authenticated ? keycloak.tokenParsed.preferred_username : localStorage.getItem('virtoUsername')}
                                </Typography>
                                <MenuButton subLinks={appbarMenuButtonItems} signout={handleSignOut}/>
                            </React.Fragment>
                        ) : null}
                    </Toolbar>
                </AppBar>

                <Drawer
                    sx={{
                        width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': {
                            width: drawerWidth, boxSizing: 'border-box',
                        },
                    }}
                    variant="persistent"
                    anchor="left"
                    open={drawerOpen}>
                    <DrawerHeader>
                        {/* Drawer top left banner logo */}
                        <img src="/images/logo-deeptsf.png" alt="" height={'60px'}
                             style={{objectFit: 'cover', padding: '10px 0'}}/>
                        <IconButton onClick={handleDrawerClose}>
                            {theme.direction === 'ltr' ? <ChevronLeftIcon/> : <ChevronRightIcon/>}
                        </IconButton>
                    </DrawerHeader>

                    <Divider/>

                    <List>
                        {menu.map(item => (
                            <div key={item.text}>
                                <ListItemButton
                                    onClick={item.handleNested ? item.handleNested : item.link ? () => window.open(item.link, '_blank') : () => navigate(item.path)}
                                    key={item.text}
                                    className={location.pathname === item.path ? 'menuItemActive' : null}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text}></ListItemText>
                                    {item.subItems && (item.collapsed ? <ExpandLessIcon/> : <ExpandMoreIcon/>)}
                                </ListItemButton>
                                {item.subItems && item.subItems.map(subItem => (<Link key={subItem.text}
                                                                                      style={{
                                                                                          textDecoration: 'none',
                                                                                          color: '#000'
                                                                                      }}>
                                    <Collapse in={item.collapsed} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            <ListItemButton sx={{pl: 4}}
                                                            className={clsx(classes.nested, location.pathname === subItem.path ? 'menuItemActive' : null)}>
                                                <ListItemIcon>
                                                    {subItem.icon}
                                                </ListItemIcon>
                                                <ListItemText primary={subItem.text}/>
                                            </ListItemButton>
                                        </List>
                                    </Collapse>
                                </Link>))}
                            </div>))}
                    </List>
                    <Divider/>

                    <List>
                        {keycloak.authenticated === false && localStorage.getItem('authMethod') !== 'virto' && <SignedOutLinks navigate={navigate} location={location}/>}
                        {keycloak.authenticated === true || localStorage.getItem('authMethod') === 'virto' ? (
                            <SignedInLinks navigate={navigate} location={location} handleSignOut={handleSignOut}/>
                        ) : null}
                        {/* Only show DeployAI Login if user is not authenticated through any method */}
                        {!keycloak.authenticated && localStorage.getItem('authMethod') !== 'virto' && (
                            <ListItemButton onClick={handleVirtoLoginClick}>
                                <ListItemIcon>
                                    <LockOutlinedIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText primary="DeployAI Login" />
                            </ListItemButton>
                        )}
                        {showVirtoLoginForm && !keycloak.authenticated && localStorage.getItem('authMethod') !== 'virto' && <VirtoLoginForm />}
                        {virtoResponse && <Typography>{virtoResponse}</Typography>}
                        {virtoError && <Typography color="error">{virtoError}</Typography>}
                    </List>

                </Drawer>
                <Main open={drawerOpen} style={{overflow: 'hidden', paddingBottom: 0}}>
                    <DrawerHeader/>
                    {children}
                </Main>
            </Box>
            <Footer sx={{position: 'sticky', mt: 'auto'}} open={drawerOpen}><FooterContent/></Footer>
        </React.Fragment>);
}
