import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import { Button, Stack, Typography } from '@mui/material';

function ResendOtp({ countdown, loading, onResend }) {
  const disabled = countdown > 0 || loading;

  return (
    <Stack className="resend-row" direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        {countdown > 0
          ? `You can resend OTP in ${countdown} seconds.`
          : 'Did not receive the OTP?'}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        disabled={disabled}
        onClick={onResend}
        startIcon={<ReplayOutlinedIcon />}
      >
        Resend OTP
      </Button>
    </Stack>
  );
}

export default ResendOtp;
