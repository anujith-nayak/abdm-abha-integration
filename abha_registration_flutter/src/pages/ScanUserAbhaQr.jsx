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
  Divider
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';

const QR_SCANNER_ID = 'qr-scanner-region';

function ScanUserAbhaQr() {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('Ready to scan an ABHA card QR code.');
  const [decodedContent, setDecodedContent] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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
    console.debug('[ScanUserAbhaQr]', message, details || '');
  };

  const processDecodedText = (text) => {
    logEvent('QR decoded content', { preview: text?.slice(0, 180) });

    if (!text || !text.trim()) {
      setErrorMessage('The QR code was scanned, but the content is empty.');
      setDecodedContent('');
      setParsedData(null);
      return;
    }

    setDecodedContent(text);
    setErrorMessage('');

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        setParsedData(parsed);
      } else {
        setParsedData(null);
      }
    } catch {
      setParsedData(null);
    }
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
      setScanStatus('Point your camera at the ABHA card QR code.');
    } catch (error) {
      const message = error?.message || 'Unable to access camera hardware.';
      logEvent('Camera scan failed', message);
      setErrorMessage(`Camera scan failed: ${message}`);
      setScanStatus('Camera scan is not active.');
      if (scannerRef.current) {
        await stopScanner();
      }
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setErrorMessage('');
    setScanStatus('Scanning uploaded image...');

    try {
      if (isScanning) {
        await stopScanner();
      }

      const tempScanner = new Html5Qrcode(QR_SCANNER_ID);
      const result = await tempScanner.scanFileV2(file, true);
      await tempScanner.clear();
      logEvent('Image scan completed', { fileName: file.name, result });

      if (result?.decodedText) {
        processDecodedText(result.decodedText);
        setScanStatus('Scan completed successfully.');
      } else {
        throw new Error('No QR code was detected in the selected image.');
      }
    } catch (error) {
      const message = error?.message || 'Could not decode a QR code from the selected image.';
      logEvent('Image scan failed', message);
      setErrorMessage(`Image scan failed: ${message}`);
      setScanStatus('Select a different image or use the camera scan.');
    } finally {
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
                  Scan User ABHA QR
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Scan your ABHA card QR using your camera or upload an image to decode ABHA data securely.
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
                  setScanStatus('Ready to scan an ABHA card QR code.');
                }}
              >
                Clear Results
              </Button>
            </Stack>

            <Stack spacing={2}>
              <Alert severity="info">{scanStatus}</Alert>
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

              {parsedData && (
                <Box>
                  <Typography variant="subtitle1">Parsed ABHA data</Typography>
                  <Stack spacing={1.5} className="details-list">
                    {Object.entries(parsedData).map(([key, value]) => (
                      <Box className="detail-row" key={key}>
                        <Typography variant="body2" color="text.secondary">
                          {key}
                        </Typography>
                        <Typography variant="body1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
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

export default ScanUserAbhaQr;
