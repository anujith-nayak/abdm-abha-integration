import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App.jsx';
import './styles/app.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#087f8c',
      dark: '#055e68',
      light: '#d9f3f6'
    },
    secondary: {
      main: '#2454a6'
    },
    success: {
      main: '#17875b'
    },
    background: {
      default: '#f5f8fb',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h4: {
      fontWeight: 800
    },
    h5: {
      fontWeight: 750
    },
    button: {
      fontWeight: 700,
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 46
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
