import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import Loader from '../components/Loader.jsx';
import OtpForm from '../components/OtpForm.jsx';
import ResendOtp from '../components/ResendOtp.jsx';
import { resendOtp, verifyOtp } from '../services/api.js';

const otpPattern = /^\d{6}$/;
const mobilePattern = /^\d{10}$/;

function VerifyOtp({ showAlert }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const aadhaar = state?.aadhaar || '';
  const initialTxnId = state?.txnId || '';

  const [otp, setOtp] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpError, setOtpError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [txnId, setTxnId] = useState(initialTxnId);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!aadhaar) {
      showAlert('Please generate OTP before verification.', 'warning');
      navigate('/');
    }
  }, [aadhaar, navigate, showAlert]);

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (otpError) {
      setOtpError('');
    }
  };

  const handleMobileChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
    if (mobileError) {
      setMobileError('');
    }
  };

  const validateOtp = () => {
    if (!otp.trim()) {
      return 'OTP is required.';
    }

    if (!otpPattern.test(otp)) {
      return 'Enter a valid 6-digit OTP.';
    }

    return '';
  };

  const validateMobile = () => {
    if (!mobile.trim()) {
      return 'Mobile number is required.';
    }

    if (!mobilePattern.test(mobile)) {
      return 'Enter a valid 10-digit mobile number.';
    }

    return '';
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const otpValidationError = validateOtp();
    const mobileValidationError = validateMobile();

    if (otpValidationError || mobileValidationError) {
      setOtpError(otpValidationError);
      setMobileError(mobileValidationError);
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp({ otp, txnId, mobile });
      showAlert('ABHA registration completed successfully.', 'success');
      navigate('/success', { state: { abhaDetails: data } });
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const data = await resendOtp({ aadhaar, txnId });
      const nextTxnId = data?.txnId || data?.transactionId || data?.txnID;
      if (nextTxnId) {
        setTxnId(nextTxnId);
      }
      setOtp('');
      setCountdown(30);
      showAlert('OTP resent successfully.', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="page compact-page">
      <Container maxWidth="sm">
        <Paper elevation={0} className="portal-card">
          <Stack spacing={2.5}>
            <Button
              className="back-button"
              variant="text"
              onClick={() => navigate('/')}
              startIcon={<ArrowBackOutlinedIcon />}
            >
              Back to Aadhaar
            </Button>
            <Box className="icon-heading">
              <Box className="heading-icon" aria-hidden="true">
                <MarkEmailReadOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="h5" component="h1">
                  Verify OTP
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete ABHA registration with the OTP sent to your registered mobile number.
                </Typography>
              </Box>
            </Box>
            <OtpForm
              otp={otp}
              mobile={mobile}
              error={otpError}
              mobileError={mobileError}
              loading={loading}
              onChange={handleOtpChange}
              onMobileChange={handleMobileChange}
              onSubmit={handleVerify}
            />
            <ResendOtp countdown={countdown} loading={resending} onResend={handleResend} />
            {(loading || resending) && (
              <Loader message={loading ? 'Verifying OTP...' : 'Resending OTP...'} />
            )}
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}

export default VerifyOtp;
