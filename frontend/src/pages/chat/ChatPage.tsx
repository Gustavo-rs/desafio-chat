import { Box, Typography } from '@mui/material';

export default function ChatPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <Typography variant="h3">
        Hello World
      </Typography>
    </Box>
  );
}
