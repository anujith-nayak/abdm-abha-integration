import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import Loader from '../components/Loader.jsx';
import { downloadAbhaCard } from '../services/api.js';

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

function Success({ showAlert }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const abhaDetails = state?.abhaDetails || {};
  const [downloading, setDownloading] = useState(false);

  const abhaNumber = getNestedValue(abhaDetails, [
    'abhaNumber',
    'ABHANumber',
    'healthIdNumber',
    'healthId',
    'abha_number'
  ]);

  const abhaAddress = getNestedValue(abhaDetails, [
    'abhaAddress',
    'healthId',
    'preferredAbhaAddress',
    'phrAddress',
    'abha_address'
  ]);

  const rows = [
    ['ABHA Number', abhaNumber],
    ['ABHA Address', abhaAddress],
    ['Name', getNestedValue(abhaDetails, ['name', 'fullName', 'firstName'])],
    ['Gender', getNestedValue(abhaDetails, ['gender'])],
    ['Date of Birth', getNestedValue(abhaDetails, ['dob', 'dateOfBirth', 'yearOfBirth'])]
  ].filter(([, value]) => Boolean(value));

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
            <Stack spacing={1.5} className="details-list">
              {rows.length > 0 ? (
                rows.map(([label, value]) => (
                  <Box className="detail-row" key={label}>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="body1">{value}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1">
                  No ABHA number was returned by the API response.
                </Typography>
              )}
            </Stack>
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
            {downloading && <Loader message="Downloading ABHA Card..." />}
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}

export default Success;
