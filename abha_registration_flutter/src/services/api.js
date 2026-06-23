import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

const normalizeError = (error, fallback) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (typeof error.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
};

const normalizeData = (data) => {
  if (typeof data !== 'string') {
    return data;
  }

  if (data.trim().toLowerCase().startsWith('error')) {
    throw new Error(data);
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

export const generateOtp = async (aadhaar) => {
  try {
    const response = await apiClient.get('/api/abha/generate-otp', {
      params: { aadhaar }
    });
    return normalizeData(response.data);
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to generate OTP.'));
  }
};

export const verifyOtp = async ({ otp, txnId, mobile }) => {
  try {
    const response = await apiClient.post('/api/abha/verifyOtp', {
      otp,
      txnId,
      mobile
    });
    return normalizeData(response.data);
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to verify OTP.'));
  }
};

export const resendOtp = async ({ aadhaar, txnId }) => {
  try {
    const response = await apiClient.post('/api/abha/resendOtp', {
      aadhaar,
      txnId
    });
    return normalizeData(response.data);
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to resend OTP.'));
  }
};
