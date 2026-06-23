import { Box, CircularProgress, Typography } from '@mui/material';

function Loader({ message = 'Processing request...' }) {
  return (
    <Box className="loader" role="status" aria-live="polite">
      <CircularProgress size={24} thickness={5} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

export default Loader;
