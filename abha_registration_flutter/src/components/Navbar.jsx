import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';

function Navbar() {
  return (
    <AppBar position="sticky" elevation={0} className="navbar">
      <Container maxWidth="lg">
        <Toolbar disableGutters className="navbar-toolbar">
          <Box className="brand-mark" aria-hidden="true">
            <LocalHospitalOutlinedIcon />
          </Box>
          <Box className="brand-copy">
            <Typography variant="h6" component="div">
              ABHA Registration Portal
            </Typography>
            <Typography variant="caption">Ayushman Bharat Health Account</Typography>
          </Box>
          <Box className="secure-badge">
            <ShieldOutlinedIcon fontSize="small" />
            <Typography variant="body2">Secure ABDM Workflow</Typography>
          </Box>
          <Box className="nav-actions" sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={RouterLink}
              to="/scan-user-abha-qr"
              variant="contained"
              color="secondary"
              size="small"

            >
              Scan User ABHA QR
            </Button>
            <Button
              component={RouterLink}
              to="/scan-facility-qr"
              variant="contained"
              color="secondary"
              size="small"
            >
              Scan Facility QR
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
