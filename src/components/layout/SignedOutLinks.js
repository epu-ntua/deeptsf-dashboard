import React from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import useAuth from '../../hooks/useAuth';

const SignedOutLinks = ({navigate, location}) => {
    const {handleLogin} = useAuth();

    return (
        <React.Fragment>
            <ListItemButton
                onClick={handleLogin} key={'SignIn'}
                className={location.pathname === '/signin' ? 'menuItemActive' : null}
            >
                <ListItemIcon>{<LoginOutlinedIcon color="secondary"/>}</ListItemIcon>
                <ListItemText primary={'SignIn'}></ListItemText>
            </ListItemButton>
        </React.Fragment>
    );
}

export default SignedOutLinks;