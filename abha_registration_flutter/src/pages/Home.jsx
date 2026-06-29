import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AadhaarForm from '../components/AadhaarForm.jsx';
import Loader from '../components/Loader.jsx';
import {
  generateOtp,
  registerPatient,
  requestAbhaAddressOtp,
  searchAbhaAddress,
  verifyAbhaAddressOtp
} from '../services/api.js';

const aadhaarPattern = /^\d{12}$/;

const looksLikeAbhaAddress = (value) => typeof value === 'string' && value.includes('@');

const firstStringValue = (source, keys) => {
  if (!source || typeof source !== 'object') {
    return '';
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const normalizeAbhaSearchResults = (payload) => {
  if (!payload) {
    return [];
  }

  const results = [];
  const seen = new Set();

  const addCandidate = (candidate, fallbackLabel = '') => {
    const value = typeof candidate === 'string' ? candidate.trim() : '';
    if (!value || !looksLikeAbhaAddress(value) || seen.has(value)) {
      return;
    }

    seen.add(value);
    results.push({
      value,
      label: fallbackLabel || value
    });
  };

  const visit = (value) => {
    if (typeof value === 'string') {
      addCandidate(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (!value || typeof value !== 'object') {
      return;
    }

    const directValue = firstStringValue(value, [
      'abhaAddress',
      'healthId',
      'phrAddress',
      'preferredAbhaAddress',
      'value',
      'loginId'
    ]);

    if (directValue) {
      addCandidate(directValue, firstStringValue(value, ['name', 'displayName', 'fullName', 'patientName']) || directValue);
      return;
    }

    Object.values(value).forEach(visit);
  };

  visit(payload);
  return results;
};

function Home({ showAlert }) {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();

  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');
  const [loading, setLoading] = useState(false);
  const [abhaAddress, setAbhaAddress] = useState('');
  const [abhaSearchLoading, setAbhaSearchLoading] = useState(false);
  const [abhaSearchResults, setAbhaSearchResults] = useState([]);
  const [selectedAbhaAddress, setSelectedAbhaAddress] = useState('');
  const [otpRequestLoading, setOtpRequestLoading] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  // If arriving from ABHA verification, pre-populate the verified profile
  const [verifiedProfile, setVerifiedProfile] = useState(routeState?.verifiedAbhaProfile || null);
  const [verificationMessage, setVerificationMessage] = useState(
    routeState?.fromVerification ? 'ABHA Address Verified Successfully' : ''
  );
  const [mrdNumber, setMrdNumber] = useState('');
  const [linkedBy, setLinkedBy] = useState('portal');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  // Show patient registration panel directly when arriving with a verified profile
  // OR when the navbar "Patient Registration" button is clicked
  const [showPatientRegistration, setShowPatientRegistration] = useState(
    Boolean(routeState?.fromVerification || routeState?.showPatientReg)
  );

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

  const handleSearchAbhaAddress = async () => {
    if (!abhaAddress.trim()) {
      showAlert('ABHA Address is required for search.', 'error');
      return;
    }

    setAbhaSearchLoading(true);
    setSelectedAbhaAddress('');
    setTxnId('');
    setOtpValue('');
    setVerificationMessage('');
    setVerifiedProfile(null);
    setRegistrationResult(null);

    try {
      const data = await searchAbhaAddress(abhaAddress.trim());
      const results = normalizeAbhaSearchResults(data);
      setAbhaSearchResults(results);

      if (results.length > 0) {
        setSelectedAbhaAddress(results[0].value);
        showAlert('ABHA address search completed.', 'success');
      } else {
        showAlert('No ABHA address matches were returned.', 'info');
      }
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setAbhaSearchLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!selectedAbhaAddress) {
      showAlert('Select an ABHA address before requesting OTP.', 'error');
      return;
    }

    setOtpRequestLoading(true);
    setOtpValue('');
    setTxnId('');
    setVerificationMessage('');
    setVerifiedProfile(null);
    setRegistrationResult(null);

    try {
      const data = await requestAbhaAddressOtp({
        abhaAddress: selectedAbhaAddress,
        txnId: ''
      });
      const nextTxnId = data?.txnId || data?.transactionId || data?.txnID || '';
      setTxnId(nextTxnId);
      showAlert('OTP requested successfully.', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setOtpRequestLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedAbhaAddress || !txnId || !otpValue.trim()) {
      showAlert('Select an ABHA address, provide the OTP, and wait for the transaction ID.', 'error');
      return;
    }

    setVerifyLoading(true);
    setRegistrationResult(null);

    try {
      const data = await verifyAbhaAddressOtp({
        abhaAddress: selectedAbhaAddress,
        txnId,
        otp: otpValue.trim(),
        linkedBy: linkedBy || 'portal'
      });

      const nextProfile = data?.abhaProfile || null;
      setVerifiedProfile(nextProfile);
      setVerificationMessage(data?.message || 'ABHA Address Verified Successfully');
      showAlert(data?.message || 'ABHA Address Verified Successfully', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePatientRegistration = async () => {
    if (!verifiedProfile) {
      showAlert('Verify an ABHA address first to continue patient registration.', 'error');
      return;
    }

    setRegisterLoading(true);
    setRegistrationResult(null);

    try {
      const payload = {
        mrdNumber: mrdNumber.trim() || undefined,
        abhaAddress: verifiedProfile.abhaAddress || selectedAbhaAddress,
        abhaProfile: verifiedProfile,
        linkedBy: linkedBy || 'portal',
        withoutAbha: false
      };

      const result = await registerPatient(payload);
      setRegistrationResult(result);
      showAlert(result?.message || 'Patient registration completed.', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <main className="page">
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="flex-start">
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
            <Stack spacing={2.5}>
              {/* ── Patient Registration panel (visible after ABHA verification or via nav button) ── */}
              {showPatientRegistration ? (
                <Paper elevation={0} className="portal-card">
                  <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h5" component="h2">
                          Patient Registration
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Register or link a patient using the verified ABHA profile.
                        </Typography>
                      </Box>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                          setShowPatientRegistration(false);
                          setVerifiedProfile(null);
                          setVerificationMessage('');
                          setRegistrationResult(null);
                          setMrdNumber('');
                        }}
                      >
                        ✕ Close
                      </Button>
                    </Stack>

                    {verificationMessage && (
                      <Alert severity="success">{verificationMessage}</Alert>
                    )}

                    {verifiedProfile && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Verified ABHA Profile</Typography>
                        <Stack spacing={0.5}>
                          {[
                            ['Name',         verifiedProfile.name],
                            ['ABHA Number',  verifiedProfile.abhaNumber],
                            ['ABHA Address', verifiedProfile.abhaAddress],
                            ['Gender',       verifiedProfile.gender],
                            ['Date of Birth',verifiedProfile.dob],
                            ['Mobile',       verifiedProfile.mobileNumber],
                          ]
                            .filter(([, v]) => v)
                            .map(([label, val]) => (
                              <Box className="detail-row" key={label}>
                                <Typography variant="body2" color="text.secondary">{label}</Typography>
                                <Typography variant="body2">{val}</Typography>
                              </Box>
                            ))}
                        </Stack>
                      </Box>
                    )}

                    <TextField
                      label="MRD Number (optional)"
                      value={mrdNumber}
                      onChange={(e) => setMrdNumber(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Linked By"
                      value={linkedBy}
                      onChange={(e) => setLinkedBy(e.target.value)}
                      fullWidth
                    />

                    <Button
                      variant="contained"
                      onClick={handlePatientRegistration}
                      disabled={registerLoading || !verifiedProfile}
                    >
                      {registerLoading ? 'Processing…' : 'Register / Link Patient'}
                    </Button>

                    {registrationResult && (
                      <Alert
                        severity={
                          registrationResult.status === 'NEW_PATIENT_CREATED' ||
                          registrationResult.status === 'PATIENT_LINKED'
                            ? 'success'
                            : registrationResult.status === 'LINK_REVIEW_REQUIRED'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {registrationResult.message || 'Registration completed.'}
                        {registrationResult.mismatchReasons?.length > 0 && (
                          <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                            {registrationResult.mismatchReasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </Box>
                        )}
                      </Alert>
                    )}

                    {registrationResult?.matchedPatient && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Matched Patient</Typography>
                        <Typography variant="body2">Name: {registrationResult.matchedPatient.name || '—'}</Typography>
                        <Typography variant="body2">MRD: {registrationResult.matchedPatient.mrdNumber || '—'}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              ) : (
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Continue to ABHA creation with Aadhaar OTP verification or scan a facility QR code.
                      </Typography>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => navigate('/scan-facility-qr')}
                      >
                        Scan Health Facility QR
                      </Button>
                    </Box>
                    {loading && <Loader message="Generating OTP..." />}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
}

export default Home;
