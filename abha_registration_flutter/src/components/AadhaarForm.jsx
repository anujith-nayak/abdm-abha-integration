import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SendToMobileOutlinedIcon from '@mui/icons-material/SendToMobileOutlined';
import { Button, InputAdornment, Stack, TextField } from '@mui/material';

function AadhaarForm({ aadhaar, error, loading, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack spacing={2.5}>
        <TextField
          label="Aadhaar Number"
          value={aadhaar}
          onChange={onChange}
          error={Boolean(error)}
          helperText={error || 'Enter the 12-digit Aadhaar linked with your mobile number.'}
          inputProps={{
            maxLength: 12,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BadgeOutlinedIcon color="primary" />
              </InputAdornment>
            )
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={<SendToMobileOutlinedIcon />}
        >
          Generate OTP
        </Button>
      </Stack>
    </form>
  );
}

export default AadhaarForm;
