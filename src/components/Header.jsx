import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';

const Header = ({ darkMode, toggleDarkMode }) => (
  <AppBar position="static" elevation={3}>
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Healthcare Translator
      </Typography>
      <IconButton onClick={toggleDarkMode} color="inherit">
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Toolbar>
  </AppBar>
);

export default Header;
