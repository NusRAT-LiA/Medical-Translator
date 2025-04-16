// theme.js
import { createTheme } from '@mui/material';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6fbd7f' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
  typography: {
    fontFamily: 'Montserrat, Roboto, sans-serif',
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#072c52' },
  },
  typography: {
    fontFamily: 'Montserrat, Roboto, sans-serif',
  },
});
