import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';

const QR_SCANNER_ID = 'qr-scanner-region';

const readableLabel = (key) => {
  if (!key) {
    return '';
  }

  let label = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  label = label
    .split(' ')
    .map((piece) => {
      if (/^(abdm|hip|qr|id|lgd)$/i.test(piece)) {
        return piece.toUpperCase();
      }
      return piece.charAt(0).toUpperCase() + piece.slice(1);
    })
    .join(' ');

  return label.replace(/\bLgd\b/, 'LGD');
};

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const parseUrlContent = (text) => {
  try {
    const url = new URL(text);
    const params = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return {
      url: url.href,
      params,
      hostname: url.hostname,
      pathname: url.pathname,
      protocol: url.protocol
    };
  } catch {
    return null;
  }
};

const tryParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const buildParsedData = (text) => {
  const trimmed = text?.trim();
  if (!trimmed) {
    return { type: 'text', text: '' };
  }

  const json = tryParseJson(trimmed);
  if (json !== null) {
    return { type: 'json', content: json };
  }

  const urlContent = parseUrlContent(trimmed);
  if (urlContent) {
    return { type: 'url', ...urlContent };
  }

  return { type: 'text', text: trimmed };
};

const renderJsonValue = (value, level = 0) => {
  if (Array.isArray(value)) {
    return (
      <Stack spacing={1} sx={{ pl: 2, mt: 1 }}>
        {value.map((item, index) => (
          <Box key={index} sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
            {isObject(item) || Array.isArray(item)
              ? renderJsonValue(item, level + 1)
              : <Typography variant="body2">{String(item)}</Typography>}
          </Box>
        ))}
      </Stack>
    );
  }

  if (isObject(value)) {
    return (
      <Paper variant="outlined" sx={{ p: 2, backgroundColor: level > 0 ? '#f9f9f9' : 'transparent', mt: 1 }}>
        <Stack spacing={1}>
          {Object.entries(value).map(([key, nestedValue]) => (
            <Box key={key}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                {readableLabel(key)}
              </Typography>
              {renderJsonValue(nestedValue, level + 1)}
            </Box>
          ))}
        </Stack>
      </Paper>
    );
  }

  return <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(value)}</Typography>;
};

const renderUrlContent = (parsedData) => (
  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
      URL
    </Typography>
    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
      {parsedData.url}
    </Typography>
    {parsedData.params && Object.keys(parsedData.params).length > 0 && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Query Parameters
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              {Object.entries(parsedData.params).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell sx={{ fontWeight: 700 }}>{readableLabel(key)}</TableCell>
                  <TableCell>{String(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )}
  </Paper>
);

const renderParsedData = (parsedData) => {
  if (!parsedData) {
    return null;
  }

  if (parsedData.type === 'json') {
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Decoded QR Information
        </Typography>
        {renderJsonValue(parsedData.content)}
      </Paper>
    );
  }

  if (parsedData.type === 'url') {
    return renderUrlContent(parsedData);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Decoded Text
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {parsedData.text}
      </Typography>
    </Paper>
  );
};

function ScanHealthFacilityQr() {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('Ready to scan a health facility QR code.');
  const [decodedContent, setDecodedContent] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear().catch(() => {});
          });
      }
    };
  }, []);

  const logEvent = (message, details) => {
    console.debug('[ScanHealthFacilityQr]', message, details || '');
  };

  const processDecodedText = (text) => {
    const rawText = text ?? '';
    console.debug('[ScanHealthFacilityQr] QR decoded raw content', rawText);
    logEvent('QR decoded raw content', rawText);

    if (!rawText.trim()) {
      setErrorMessage('Unable to detect a valid QR Code.');
      setSuccessMessage('');
      setDecodedContent('');
      setParsedData(null);
      return;
    }

    setDecodedContent(rawText);
    setErrorMessage('');
    setSuccessMessage('QR code decoded successfully.');
    setParsedData(buildParsedData(rawText));
  };

  const stopScanner = async () => {
    if (!scannerRef.current) {
      setIsScanning(false);
      return;
    }

    try {
      await scannerRef.current.stop();
    } catch (error) {
      logEvent('Failed to stop camera scanner', error?.message || error);
    }

    try {
      await scannerRef.current.clear();
    } catch (error) {
      logEvent('Failed to clear camera scanner', error?.message || error);
    }

    scannerRef.current = null;
    setIsScanning(false);
    setScanStatus('Camera scanner stopped. You can scan again or upload an image.');
  };

  const startScanner = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setDecodedContent('');
    setParsedData(null);
    setScanStatus('Requesting camera permission...');

    if (isScanning) {
      return;
    }

    if (scannerRef.current) {
      await stopScanner();
    }

    const html5QrCode = new Html5Qrcode(QR_SCANNER_ID);
    scannerRef.current = html5QrCode;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No camera devices were found.');
      }

      const cameraId = devices[0].id;
      logEvent('Starting camera scan', { cameraId });

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: {
            width: 280,
            height: 280
          }
        },
        async (decodedText) => {
          setScanStatus('QR code detected successfully. Processing result...');
          processDecodedText(decodedText);
          await stopScanner();
          setScanStatus('Scan completed successfully.');
        },
        (errorMessage) => {
          logEvent('Camera scan in progress', errorMessage);
        }
      );

      setIsScanning(true);
      setScanStatus('Point your camera at the health facility QR code.');
    } catch (error) {
      const message = error?.message || 'Unable to access camera hardware.';
      logEvent('Camera scan failed', message);
      setErrorMessage(`Camera scan failed: ${message}`);
      setSuccessMessage('');
      setScanStatus('Camera scan is not active.');
      if (scannerRef.current) {
        await stopScanner();
      }
    }
  };

  const getDecodedTextFromResult = (result) => {
    if (!result) {
      return '';
    }
    if (typeof result === 'string') {
      return result;
    }
    return result.decodedText || '';
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setDecodedContent('');
    setParsedData(null);
    setScanStatus('Scanning uploaded image...');

    const tempScanner = new Html5Qrcode(QR_SCANNER_ID);
    try {
      if (isScanning) {
        await stopScanner();
      }

      let decodedText = '';
      try {
        const result = await tempScanner.scanFileV2(file, true);
        decodedText = getDecodedTextFromResult(result);
      } catch (primaryError) {
        console.warn('[ScanHealthFacilityQr] scanFileV2 failed', primaryError);
        logEvent('scanFileV2 failed', primaryError?.message || primaryError);

        try {
          const fallbackResult = await tempScanner.scanFile(file, true);
          decodedText = getDecodedTextFromResult(fallbackResult);
        } catch (fallbackError) {
          console.error('[ScanHealthFacilityQr] scanFile fallback failed', fallbackError);
          logEvent('scanFile fallback failed', fallbackError?.message || fallbackError);
          throw fallbackError || primaryError;
        }
      }

      await tempScanner.clear();
      logEvent('Image scan completed', { fileName: file.name, decodedText });

      if (!decodedText?.trim()) {
        throw new Error('Unable to detect a valid QR Code.');
      }

      processDecodedText(decodedText);
      setScanStatus('Scan completed successfully.');
    } catch (error) {
      console.error('Image scan error:', error);
      const message = error?.message || 'Unable to detect a valid QR Code.';
      logEvent('Image scan failed', message);
      setErrorMessage(message === 'Unable to detect a valid QR Code.' ? message : `Unable to detect a valid QR Code.`);
      setSuccessMessage('');
      setScanStatus('Select a different image or use the camera scan.');
    } finally {
      await tempScanner.clear().catch(() => {});
      event.target.value = '';
    }
  };

  return (
    <main className="page compact-page">
      <Container maxWidth="lg">
        <Paper elevation={0} className="portal-card scan-card">
          <Stack spacing={3}>
            <Box className="icon-heading">
              <Box className="heading-icon" aria-hidden="true">
                <QrCodeScannerOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="h5" component="h1">
                  Scan Health Facility QR
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Scan a facility QR code using your camera or upload an image to decode facility data securely.
                </Typography>
              </Box>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} className="scan-actions">
              <Button
                variant="contained"
                onClick={startScanner}
                startIcon={<PhotoCameraOutlinedIcon />}
              >
                {isScanning ? 'Restart Camera Scan' : 'Scan with Camera'}
              </Button>
              <Button variant="outlined" component="label" startIcon={<UploadFileOutlinedIcon />}>
                Upload QR Image
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                />
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setDecodedContent('');
                  setParsedData(null);
                  setErrorMessage('');
                  setSuccessMessage('');
                  setScanStatus('Ready to scan a health facility QR code.');
                }}
              >
                Clear Results
              </Button>
            </Stack>

            <Stack spacing={2}>
              <Alert severity="info">{scanStatus}</Alert>
              {successMessage && (
                <Alert severity="info" color="info">
                  {successMessage}
                </Alert>
              )}
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            </Stack>

            <Box id={QR_SCANNER_ID} className="scanner-area" />

            <Divider />

            <Stack spacing={2}>
              {decodedContent ? (
                <Box>
                  <Typography variant="subtitle1">Decoded QR content</Typography>
                  <Box component="pre" className="qr-result" tabIndex={0}>
                    {decodedContent}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No QR content decoded yet. Use the camera or upload an image to begin.
                </Typography>
              )}

              {renderParsedData(parsedData)}
            </Stack>

            <Box>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/"
                startIcon={<ArrowBackOutlinedIcon />}
              >
                Back to Registration
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}

export default ScanHealthFacilityQr;
