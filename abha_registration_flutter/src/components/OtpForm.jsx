import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import { Button, InputAdornment, Stack, TextField } from '@mui/material';

function OtpForm({
  otp,
  mobile,
  error,
  mobileError,
  loading,
  onChange,
  onMobileChange,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack spacing={2.5}>
        <TextField
          label="Mobile Number"
          value={mobile}
          onChange={onMobileChange}
          error={Boolean(mobileError)}
          helperText={mobileError || 'Enter the 10-digit mobile number used for Aadhaar OTP.'}
          inputProps={{
            maxLength: 10,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SmartphoneOutlinedIcon color="primary" />
              </InputAdornment>
            )
          }}
        />
        <TextField
          label="OTP"
          value={otp}
          onChange={onChange}
          error={Boolean(error)}
          helperText={error || 'Enter the 6-digit OTP received on your Aadhaar-linked mobile number.'}
          inputProps={{
            maxLength: 6,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VpnKeyOutlinedIcon color="primary" />
              </InputAdornment>
            )
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={<VerifiedUserOutlinedIcon />}
        >
          Verify OTP
        </Button>
      </Stack>
    </form>
  );
}

export default OtpForm;
