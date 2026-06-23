import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';

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
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
