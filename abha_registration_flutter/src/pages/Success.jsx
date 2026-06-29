import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Alert, Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import Loader from '../components/Loader.jsx';
import {
  downloadAbhaCard,
  requestAbhaAddressOtp,
  searchAbhaAddress,
  verifyAbhaAddressOtp
} from '../services/api.js';

const getNestedValue = (source, keys) => {
  if (!source || typeof source !== 'object') {
    return '';
  }
  for (const key of keys) {
    if (source[key]) {
      return source[key];
    }
  }
  for (const value of Object.values(source)) {
    if (value && typeof value === 'object') {
      const nested = getNestedValue(value, keys);
      if (nested) {
        return nested;
      }
    }
  }
  return '';
};

// Extracts the first abha-address-format string (@-containing) from any search response shape
const extractFirstAbhaAddress = (payload) => {
  if (!payload) return null;

  const tryString = (val) =>
    typeof val === 'string' && val.trim().includes('@') ? val.trim() : null;

  const addressKeys = ['abhaAddress', 'healthId', 'phrAddress', 'preferredAbhaAddress', 'value', 'loginId'];

  const visit = (node) => {
    if (typeof node === 'string') return tryString(node);
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }
    if (node && typeof node === 'object') {
      for (const key of addressKeys) {
        const found = tryString(node[key]);
        if (found) return found;
      }
      for (const val of Object.values(node)) {
        const found = visit(val);
        if (found) return found;
      }
    }
    return null;
  };

  return visit(payload);
};

function Success({ showAlert }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const abhaDetails = state?.abhaDetails || {};

  const abhaNumber = getNestedValue(abhaDetails, ['abhaNumber', 'ABHANumber', 'healthIdNumber', 'healthId', 'abha_number']);
  const abhaAddress = getNestedValue(abhaDetails, ['abhaAddress', 'healthId', 'preferredAbhaAddress', 'phrAddress', 'abha_address']);

  const rows = [
    ['ABHA Number', abhaNumber],
    ['ABHA Address', abhaAddress],
    ['Name', getNestedValue(abhaDetails, ['name', 'fullName', 'firstName'])],
    ['Gender', getNestedValue(abhaDetails, ['gender'])],
    ['Date of Birth', getNestedValue(abhaDetails, ['dob', 'dateOfBirth', 'yearOfBirth'])],
    ['Mobile Number', getNestedValue(abhaDetails, ['mobile', 'mobileNumber', 'phoneNumber', 'phone'])]
  ].filter(([, value]) => Boolean(value));

  // ── Verification flow state ──────────────────────────────────────────────
  const [showVerificationSection, setShowVerificationSection] = useState(false);
  const [abhaAddressInput, setAbhaAddressInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);     // covers search + requestOtp
  const [otpReady, setOtpReady] = useState(false);               // true after OTP is sent
  const [resolvedAddress, setResolvedAddress] = useState('');    // address confirmed by search
  const [txnId, setTxnId] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [verifiedProfile, setVerifiedProfile] = useState(null);

  // ── Download state ────────────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false);

  const resetVerification = () => {
    setShowVerificationSection(false);
    setAbhaAddressInput('');
    setVerifyLoading(false);
    setOtpReady(false);
    setResolvedAddress('');
    setTxnId('');
    setOtp('');
    setVerifyOtpLoading(false);
    setVerifiedProfile(null);
  };

  // Step 1 ── Search then auto-request OTP, all in one user action
  const handleVerify = async () => {
    const input = abhaAddressInput.trim();
    if (!input) {
      showAlert('Please enter an ABHA Address.', 'error');
      return;
    }

    setVerifyLoading(true);
    setOtpReady(false);
    setResolvedAddress('');
    setTxnId('');
    setOtp('');
    setVerifiedProfile(null);

    try {
      // 1a. Search
      const searchData = await searchAbhaAddress(input);
      const matched = extractFirstAbhaAddress(searchData);

      if (!matched) {
        showAlert('No matching ABHA Address found. Please check and try again.', 'error');
        return;
      }

      setResolvedAddress(matched);

      // 1b. Auto request OTP using matched address
      const otpData = await requestAbhaAddressOtp({ abhaAddress: matched, txnId: '' });
      const nextTxnId = otpData?.txnId || otpData?.transactionId || otpData?.txnID || '';
      setTxnId(nextTxnId);
      setOtpReady(true);
      showAlert('OTP sent to your registered mobile number.', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Step 2 ── Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      showAlert('Please enter the 6-digit OTP.', 'error');
      return;
    }

    setVerifyOtpLoading(true);

    try {
      const data = await verifyAbhaAddressOtp({
        abhaAddress: resolvedAddress,
        txnId,
        otp,
        linkedBy: 'portal'
      });

      // Ensure verifiedProfile is never null so the profile card renders
      const nextProfile =
        data?.abhaProfile ||
        (data?.abdmResponse ? { abhaAddress: resolvedAddress, ...data.abdmResponse } : null) ||
        { abhaAddress: resolvedAddress };

      setVerifiedProfile(nextProfile);
      showAlert(data?.message || 'ABHA Address Verified Successfully', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { file, filename } = await downloadAbhaCard();
      const downloadUrl = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showAlert('ABHA Card downloaded successfully.', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="page compact-page">
      <Container maxWidth="sm">
        <Paper elevation={0} className="portal-card success-card">
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <CheckCircleOutlineOutlinedIcon className="success-icon" />
            <Box>
              <Typography variant="h5" component="h1">
                ABHA Created Successfully
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your registration request has been completed.
              </Typography>
            </Box>
            <Divider flexItem />

            {/* ABHA details */}
            <Stack spacing={1.5} className="details-list">
              {rows.length > 0 ? (
                rows.map(([label, value]) => (
                  <Box className="detail-row" key={label}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body1">{value}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1">
                  No ABHA number was returned by the API response.
                </Typography>
              )}
            </Stack>

            <Stack spacing={2} width="100%">
              {/* ── Pre-verification ── */}
              {!verifiedProfile && (
                <>
                  {!showVerificationSection && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setShowVerificationSection(true)}
                    >
                      Verify ABHA Address
                    </Button>
                  )}

                  {showVerificationSection && (
                    <Paper elevation={0} className="portal-card">
                      <Stack spacing={2.5}>
                        {/* Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box textAlign="left">
                            <Typography variant="h5" component="h2">
                              Verify Existing ABHA Address
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Enter your ABHA Address. An OTP will be sent automatically.
                            </Typography>
                          </Box>
                          <Button variant="text" size="small" onClick={resetVerification}>
                            ✕ Close
                          </Button>
                        </Stack>

                        {/* Stage A: ABHA Address input + Verify button */}
                        {!otpReady && (
                          <>
                            <TextField
                              label="ABHA Address"
                              value={abhaAddressInput}
                              onChange={(e) => setAbhaAddressInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                              placeholder="e.g. yourname@abdm"
                              fullWidth
                              disabled={verifyLoading}
                              autoFocus
                            />
                            <Button
                              variant="contained"
                              onClick={handleVerify}
                              disabled={verifyLoading || !abhaAddressInput.trim()}
                            >
                              {verifyLoading ? 'Sending OTP…' : 'Verify'}
                            </Button>
                          </>
                        )}

                        {/* Stage B: OTP input + Verify OTP button */}
                        {otpReady && (
                          <Stack spacing={1.5}>
                            <Alert severity="info">
                              OTP sent to the registered mobile number.
                            </Alert>
                            <TextField
                              label="OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                              placeholder="Enter 6-digit OTP"
                              inputProps={{ maxLength: 6 }}
                              fullWidth
                              autoFocus
                            />
                            <Button
                              variant="contained"
                              onClick={handleVerifyOtp}
                              disabled={verifyOtpLoading || otp.length !== 6}
                            >
                              {verifyOtpLoading ? 'Verifying…' : 'Verify OTP'}
                            </Button>
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  )}
                </>
              )}

              {/* ── Post-verification: Verified profile card + proceed button ── */}
              {verifiedProfile && (
                <Paper elevation={0} className="portal-card">
                  <Stack spacing={2.5}>

                    <Alert severity="success" icon={<CheckCircleOutlineOutlinedIcon fontSize="inherit" />}>
                      ABHA Address Verified Successfully
                    </Alert>

                    <Box textAlign="left">
                      <Typography variant="h6" component="h2" gutterBottom>
                        Verified ABHA Profile
                      </Typography>
                      <Stack spacing={1}>
                        {[
                          ['Full Name',       verifiedProfile.name],
                          ['ABHA Number',     verifiedProfile.abhaNumber],
                          ['ABHA Address',    verifiedProfile.abhaAddress || resolvedAddress],
                          ['Gender',          verifiedProfile.gender],
                          ['Date of Birth',   verifiedProfile.dob],
                          ['Mobile Number',   verifiedProfile.mobileNumber],
                          ['Address',         verifiedProfile.address],
                          ['State',           verifiedProfile.state],
                          ['District',        verifiedProfile.district],
                          ['Pin Code',        verifiedProfile.pincode],
                          ['Profile Status',  verifiedProfile.status || verifiedProfile.profileStatus],
                          ['Age',             verifiedProfile.age],
                        ]
                          .filter(([, val]) => val)
                          .map(([label, val]) => (
                            <Box className="detail-row" key={label}>
                              <Typography variant="body2" color="text.secondary">{label}</Typography>
                              <Typography variant="body1">{val}</Typography>
                            </Box>
                          ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              )}
            </Stack>

            {/* Bottom actions */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={handleDownload}
                disabled={downloading}
                startIcon={<DownloadOutlinedIcon />}
              >
                Download ABHA Card
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                startIcon={<HomeOutlinedIcon />}
              >
                Start New Registration
              </Button>
            </Stack>

            {downloading && <Loader message="Downloading ABHA Card…" />}
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}

export default Success;
