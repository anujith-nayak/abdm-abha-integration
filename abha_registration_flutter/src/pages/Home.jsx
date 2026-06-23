import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import AadhaarForm from '../components/AadhaarForm.jsx';
import Loader from '../components/Loader.jsx';
import { generateOtp } from '../services/api.js';

const aadhaarPattern = /^\d{12}$/;

function Home({ showAlert }) {
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAadhaarChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaar(value);
    if (aadhaarError) {
      setAadhaarError('');
    }
  };

  const validateAadhaar = () => {
    if (!aadhaar.trim()) {
      return 'Aadhaar number is required.';
    }

    if (!aadhaarPattern.test(aadhaar)) {
      return 'Enter a valid 12-digit Aadhaar number.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateAadhaar();

    if (validationError) {
      setAadhaarError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = await generateOtp(aadhaar);
      const txnId = data?.txnId || data?.transactionId || data?.txnID || '';

      showAlert('OTP sent successfully.', 'success');
      navigate('/verify-otp', {
        state: {
          aadhaar,
          txnId
        }
      });
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={2.5} className="hero-copy">
              <Box className="eyebrow">
                <HealthAndSafetyOutlinedIcon fontSize="small" />
                ABDM enabled registration
              </Box>
              <Typography variant="h4" component="h1">
                Create your Ayushman Bharat Health Account with Aadhaar OTP verification.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Start ABHA registration through a secure healthcare portal connected to your
                Spring Boot ABDM integration service.
              </Typography>
              <Box className="trust-strip">
                <LockOutlinedIcon color="primary" />
                <Typography variant="body2">
                  Your request is sent only to the configured backend at localhost.
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} className="portal-card">
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h5" component="h2">
                    Aadhaar Verification
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate an OTP to continue ABHA registration.
                  </Typography>
                </Box>
                <AadhaarForm
                  aadhaar={aadhaar}
                  error={aadhaarError}
                  loading={loading}
                  onChange={handleAadhaarChange}
                  onSubmit={handleSubmit}
                />
                {loading && <Loader message="Generating OTP..." />}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
}

export default Home;
