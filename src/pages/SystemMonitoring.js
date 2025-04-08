import React, {useEffect, useState} from 'react';

import Container from '@mui/material/Container';
import Typography from "@mui/material/Typography";

import Breadcrumb from "../components/layout/Breadcrumb";
import CpuUsageBarChart from "../components/systemMonitoring/CpuUsageBarChart";
import MemoryUsageBars from "../components/systemMonitoring/MemoryUsageBars";
import GpuUsageBars from "../components/systemMonitoring/GpuUsageBars";
import {useKeycloak} from "@react-keycloak/web";
import {Link, useNavigate} from "react-router-dom";

const breadcrumbs = [
    <Link className={'breadcrumbLink'} key="1" to="/">
        Homepage
    </Link>,
    <Typography
        underline="hover"
        key="2"
        color="secondary"
        fontSize={'20px'}
        fontWeight={600}>
        System Monitoring
    </Typography>
];

const SystemMonitoring = () => {
    const authenticationEnabled = process.env.REACT_APP_AUTH === "True"
    const {keycloak, initialized} = useKeycloak()
    const navigate = useNavigate();

    const [allowed, setAllowed] = useState(null);

    useEffect(() => {
        // If authentication is disabled, allow access regardless of auth status
        if (!authenticationEnabled) {
            setAllowed(true);
            return;
        }
        
        // Otherwise, check authentication status
        if (initialized) {
            // Check auth method
            const authMethod = localStorage.getItem('authMethod');
            
            if (authMethod === 'virto') {
                // Virto users have inergy_admin role
                setAllowed(true);
            } else if (keycloak.authenticated) {
                // Check for inergy_admin role in Keycloak
                const roles = keycloak.realmAccess?.roles || [];
                if (roles.includes('inergy_admin')) {
                    setAllowed(true);
                } else {
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        }
    }, [initialized, keycloak.authenticated, keycloak.realmAccess?.roles, authenticationEnabled, navigate]);

    return (
        <>
            <Breadcrumb breadcrumbs={breadcrumbs} welcome_msg={''}/>

            {/* Show content if auth is disabled or user has proper permissions */}
            {(!authenticationEnabled || (initialized && allowed)) && <>
                <Container maxWidth={'xl'} sx={{mt: 5, mb: 2}} data-testid={'systemMonitoringMemoryUsage'}>
                    <MemoryUsageBars/>
                </Container>
                <Container maxWidth={'xl'} sx={{my: 2}} data-testid={'systemMonitoringGpuUsage'}>
                    <GpuUsageBars/>
                </Container>
                <Container maxWidth={'xl'} sx={{my: 2}} data-testid={'systemMonitoringCpuUsage'}>
                    <CpuUsageBarChart/>
                </Container>
            </>}
        </>
    );
}

export default SystemMonitoring;