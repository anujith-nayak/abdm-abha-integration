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

export const searchAbhaAddress = async (abhaAddress) => {
  try {
    const response = await apiClient.post('/api/abha/address/search', {
      abhaAddress
    });
    return normalizeData(response.data);
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to search ABHA address.'));
  }
};

export const requestAbhaAddressOtp = async ({ abhaAddress, txnId }) => {
  try {
    const response = await apiClient.post('/api/abha/address/request-otp', {
      abhaAddress,
      txnId
    });
    return normalizeData(response.data);
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to request ABHA address OTP.'));
  }
};

export const verifyAbhaAddressOtp = async ({ abhaAddress, txnId, otp, linkedBy }) => {
  try {
    const response = await apiClient.post('/api/abha/address/verify', {
      abhaAddress,
      txnId,
      otp,
      linkedBy
    });
    return normalizeData(response.data);
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to verify ABHA address OTP.'));
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

const getDownloadFilename = (contentDisposition, contentType) => {
  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return contentType?.includes('pdf') ? 'ABHA_Card.pdf' : 'ABHA_Card.png';
};

export const downloadAbhaCard = async () => {
  try {
    const response = await apiClient.get('/api/abha/download-card', {
      responseType: 'blob'
    });
    const contentType = response.headers['content-type'] || response.data.type;

    return {
      file: response.data,
      filename: getDownloadFilename(response.headers['content-disposition'], contentType)
    };
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const message = await error.response.data.text();
      if (message.trim()) {
        throw new Error(message);
      }
    }

    throw new Error(normalizeError(error, 'Unable to download ABHA card.'));
  }
};

export const registerPatient = async (payload) => {
  try {
    const response = await apiClient.post('/api/patients/register', payload);
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to register or link patient.'));
  }
};

export const sendForManualReview = async (payload) => {
  try {
    const response = await apiClient.post('/api/patients/manual-review', payload);
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to send patient for manual review.'));
  }
};
