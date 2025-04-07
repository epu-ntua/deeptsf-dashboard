import React from 'react';
import { Button, Container, Typography, Grid, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAuth from '../hooks/useAuth';
import { servicesHomepage } from '../components/homepage/servicesHomepage';
import HomepageItemFullWidth from '../components/homepage/HomepageItemFullWidth';

const LandingPage = () => {
    const { handleLogin } = useAuth();
    const theme = useTheme();

    return (
        <div data-testid={"landingPage"}>
            {/* Hero Section */}
            <Box style={{ padding: theme.spacing(8, 0), textAlign: 'center', backgroundColor: '#cce0ff' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        {/* Left: Text and Login Button */}
                        <Grid item xs={12} md={6} style={{ textAlign: 'left' }}>
                            <Typography variant="h2" component="h1" color="primary" style={{ fontSize: '4.5rem', fontWeight: '600' }}>
                                DeepTSF
                            </Typography>
                            <Typography variant="h5" component="p" color="textSecondary" paragraph>
                                A machine learning operations (MLOps) framework for time series forecasting.
                            </Typography>
                            <Button variant="contained" color="primary" onClick={handleLogin} style={{ fontSize: '1rem', padding: theme.spacing(1.5, 3) }}>
                                Explore
                            </Button>
                        </Grid>
                        {/* Right: Image */}
                        <Grid item xs={12} md={6}>
                            <img src="/images/deeptsf-hero-1.svg" alt="Hero" style={{ width: '100%', height: 'auto' }} />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* What Do You Get Section */}
            
            {servicesHomepage.map((service, index) => (
                <HomepageItemFullWidth
                    key={service.id}
                    title={service.title}
                    description={service.description}
                    link={service.link}
                    icon={service.icon}
                    image={service.image}
                    index={index}
                    showLink={true}
                />
            ))}
                
        </div>
    );
};

export default LandingPage;