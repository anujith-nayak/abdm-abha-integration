import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AadhaarForm from '../components/AadhaarForm.jsx';
import Loader from '../components/Loader.jsx';
import { departmentOptions, doctorOptions } from '../config/hospitalOptions.js';
import {
  determinePatientRegistration,
  generateOtp,
  linkPatientAbha,
  registerPatient,
  requestAbhaAddressOtp,
  searchAbhaAddress,
  verifyAbhaAddressOtp
} from '../services/api.js';

const aadhaarPattern = /^\d{12}$/;
const verifiedProfileStorageKey = 'verifiedAbhaProfile';

const profileFields = [
  ['Name', 'name'],
  ['Gender', 'gender'],
  ['DOB', 'dob'],
  ['Age', 'age'],
  ['Mobile', 'mobileNumber'],
  ['Address', 'address'],
  ['State', 'state'],
  ['District', 'district'],
  ['ABHA Number', 'abhaNumber'],
  ['ABHA Address', 'abhaAddress']
];

const emptyManualProfile = {
  name: '',
  gender: '',
  dob: '',
  age: '',
  mobileNumber: '',
  address: '',
  state: '',
  district: '',
  pincode: ''
};

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

const readStoredVerifiedProfile = () => {
  try {
    const stored = sessionStorage.getItem(verifiedProfileStorageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storeVerifiedProfile = (profile) => {
  if (!profile) {
    sessionStorage.removeItem(verifiedProfileStorageKey);
    return;
  }

  sessionStorage.setItem(verifiedProfileStorageKey, JSON.stringify(profile));
};

const valuesDiffer = (left, right) => {
  const leftValue = (left ?? '').toString().trim().toLowerCase();
  const rightValue = (right ?? '').toString().trim().toLowerCase();
  return leftValue !== rightValue;
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
  const [verifiedProfile, setVerifiedProfile] = useState(routeState?.verifiedAbhaProfile || readStoredVerifiedProfile());
  const [verificationMessage, setVerificationMessage] = useState(
    routeState?.fromVerification ? 'ABHA Address Verified Successfully' : ''
  );
  const [mrdNumber, setMrdNumber] = useState('');
  const [linkedBy, setLinkedBy] = useState('portal');
  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [visitType, setVisitType] = useState('');
  const [manualProfile, setManualProfile] = useState(emptyManualProfile);
  const [determineLoading, setDetermineLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [showPatientRegistration, setShowPatientRegistration] = useState(
    Boolean(routeState?.fromVerification || routeState?.showPatientReg || routeState?.verifiedAbhaProfile)
  );

  const hospitalSpecificPayload = useMemo(() => ({
    mrdNumber: mrdNumber.trim() || undefined,
    department: department.trim() || undefined,
    doctor: doctor.trim() || undefined,
    visitType: visitType.trim() || undefined,
    linkedBy: linkedBy || 'portal'
  }), [department, doctor, linkedBy, mrdNumber, visitType]);

  const isReturningPatient = registrationResult?.status === 'RETURNING_PATIENT_FOUND';
  const isNewPatientWithAbha = verifiedProfile && registrationResult?.status === 'NEW_PATIENT_READY';

  useEffect(() => {
    if (!routeState?.verifiedAbhaProfile) {
      return;
    }

    storeVerifiedProfile(routeState.verifiedAbhaProfile);
    setVerifiedProfile(routeState.verifiedAbhaProfile);
    setShowPatientRegistration(true);
  }, [routeState?.verifiedAbhaProfile]);

  useEffect(() => {
    if (!showPatientRegistration || !verifiedProfile || registrationResult || determineLoading) {
      return;
    }

    const determineFlow = async () => {
      setDetermineLoading(true);
      try {
        const result = await determinePatientRegistration({
          abhaAddress: verifiedProfile.abhaAddress || selectedAbhaAddress,
          abhaProfile: verifiedProfile,
          linkedBy: linkedBy || 'portal',
          withoutAbha: false
        });
        setRegistrationResult(result);
      } catch (error) {
        showAlert(error.message, 'error');
      } finally {
        setDetermineLoading(false);
      }
    };

    determineFlow();
  }, [determineLoading, linkedBy, registrationResult, selectedAbhaAddress, showPatientRegistration, verifiedProfile]);

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

  const resetVerifiedState = () => {
    setVerifiedProfile(null);
    storeVerifiedProfile(null);
    setVerificationMessage('');
    setRegistrationResult(null);
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
    resetVerifiedState();

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
    resetVerifiedState();

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
      storeVerifiedProfile(nextProfile);
      setVerificationMessage(data?.message || 'ABHA Address Verified Successfully');
      setShowPatientRegistration(true);
      showAlert(data?.message || 'ABHA Address Verified Successfully', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePatientRegistration = async () => {
    setRegisterLoading(true);

    try {
      const payload = verifiedProfile
        ? {
            ...hospitalSpecificPayload,
            abhaAddress: verifiedProfile.abhaAddress || selectedAbhaAddress,
            abhaProfile: verifiedProfile,
            withoutAbha: false
          }
        : {
            ...hospitalSpecificPayload,
            hospitalProfile: manualProfile,
            withoutAbha: true
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

  const handleLinkAbha = async () => {
    const patientId = registrationResult?.matchedPatient?.id;
    if (!verifiedProfile || !patientId) {
      showAlert('A matched returning patient and verified ABHA profile are required.', 'error');
      return;
    }

    setRegisterLoading(true);
    try {
      const result = await linkPatientAbha({
        ...hospitalSpecificPayload,
        patientId,
        abhaAddress: verifiedProfile.abhaAddress || selectedAbhaAddress,
        abhaProfile: verifiedProfile,
        withoutAbha: false
      });
      setRegistrationResult(result);
      showAlert(result?.message || 'ABHA Address linked successfully.', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleManualProfileChange = (field) => (event) => {
    setManualProfile((current) => ({
      ...current,
      [field]: event.target.value
    }));
  };

  const renderHospitalFields = () => (
    <>
      <TextField
        label="MRD Number"
        value={mrdNumber}
        onChange={(e) => setMrdNumber(e.target.value)}
        fullWidth
      />
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Select</MenuItem>
            {departmentOptions.map((option) => (
              <MenuItem value={option.value} key={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Doctor"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Select</MenuItem>
            {doctorOptions.map((option) => (
              <MenuItem value={option.value} key={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Visit Type"
            value={visitType}
            onChange={(e) => setVisitType(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="OPD">OPD</MenuItem>
            <MenuItem value="IPD">IPD</MenuItem>
            <MenuItem value="Emergency">Emergency</MenuItem>
            <MenuItem value="Follow-up">Follow-up</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Linked By"
            value={linkedBy}
            onChange={(e) => setLinkedBy(e.target.value)}
            fullWidth
          />
        </Grid>
      </Grid>
    </>
  );

  const renderComparison = () => (
    <Box className="comparison-card">
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>Hospital Patient</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>Verified ABHA Profile</Typography>
        </Grid>
        {profileFields.map(([label, key]) => {
          const hospitalValue = registrationResult.hospitalProfile?.[key] || registrationResult.matchedPatient?.[key] || '';
          const abhaValue = registrationResult.abhaProfile?.[key] || verifiedProfile?.[key] || '';
          const different = valuesDiffer(hospitalValue, abhaValue);

          return (
            <Grid item xs={12} key={key}>
              <Box className={`comparison-row ${different ? 'difference-row' : ''}`}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">{hospitalValue || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">{abhaValue || '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderVerifiedProfile = () => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>Verified ABHA Profile</Typography>
      <Stack spacing={0.5}>
        {profileFields
          .map(([label, key]) => [label, verifiedProfile?.[key]])
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <Box className="detail-row" key={label}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="body2">{value}</Typography>
            </Box>
          ))}
      </Stack>
    </Box>
  );

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
              {showPatientRegistration ? (
                <Paper elevation={0} className="portal-card">
                  <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h5" component="h2">
                          Patient Registration
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Register a new hospital patient or link a verified ABHA profile.
                        </Typography>
                      </Box>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                          setShowPatientRegistration(false);
                          resetVerifiedState();
                          setMrdNumber('');
                        }}
                      >
                        Close
                      </Button>
                    </Stack>

                    {verificationMessage && <Alert severity="success">{verificationMessage}</Alert>}
                    {determineLoading && <Loader message="Checking hospital patient records..." />}
                    {isNewPatientWithAbha && <Alert severity="info">New Patient</Alert>}
                    {isReturningPatient && (
                      <Alert severity={registrationResult.mismatchReasons?.length ? 'warning' : 'success'}>
                        {registrationResult.mismatchReasons?.length
                          ? 'Demographic Differences'
                          : 'Demographics Match'}
                      </Alert>
                    )}

                    {isReturningPatient && renderComparison()}
                    {verifiedProfile && !isReturningPatient && renderVerifiedProfile()}

                    {!verifiedProfile && (
                      <Grid container spacing={1.5}>
                        {[
                          ['Name', 'name'],
                          ['Gender', 'gender'],
                          ['DOB', 'dob'],
                          ['Age', 'age'],
                          ['Mobile', 'mobileNumber'],
                          ['Address', 'address'],
                          ['State', 'state'],
                          ['District', 'district'],
                          ['Pin Code', 'pincode']
                        ].map(([label, field]) => (
                          <Grid item xs={12} sm={field === 'address' ? 12 : 6} key={field}>
                            <TextField
                              label={label}
                              value={manualProfile[field]}
                              onChange={handleManualProfileChange(field)}
                              fullWidth
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    {renderHospitalFields()}

                    {isReturningPatient ? (
                      <Button variant="contained" onClick={handleLinkAbha} disabled={registerLoading}>
                        {registerLoading ? 'Processing...' : 'Link ABHA Address'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handlePatientRegistration}
                        disabled={registerLoading || determineLoading}
                      >
                        {registerLoading ? 'Processing...' : verifiedProfile ? 'Continue Registration' : 'Register Patient'}
                      </Button>
                    )}

                    {registrationResult && registrationResult.status !== 'NEW_PATIENT_READY' && (
                      <Alert
                        severity={
                          registrationResult.status === 'NEW_PATIENT_CREATED' ||
                          registrationResult.status === 'PATIENT_LINKED'
                            ? 'success'
                            : registrationResult.status === 'RETURNING_PATIENT_FOUND'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {registrationResult.message || 'Registration completed.'}
                      </Alert>
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
