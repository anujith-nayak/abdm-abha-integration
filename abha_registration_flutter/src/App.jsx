import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Alert, Box, Snackbar } from '@mui/material';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import Success from './pages/Success.jsx';

function App() {
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
  };

  const closeAlert = () => {
    setAlert((current) => ({ ...current, open: false }));
  };

  return (
    <Box className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home showAlert={showAlert} />} />
        <Route path="/verify-otp" element={<VerifyOtp showAlert={showAlert} />} />
        <Route path="/success" element={<Success />} />
      </Routes>
      <Snackbar
        open={alert.open}
        autoHideDuration={4200}
        onClose={closeAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeAlert} severity={alert.severity} variant="filled">
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
