import React from 'react';
import { 
  Paper, 
  Button, 
  Box, 
  IconButton, 
  Typography, 
  Tooltip, 
  LinearProgress,
  Fade, 
  useTheme, 
  Chip 
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ReplayIcon from '@mui/icons-material/Replay';
import PauseIcon from '@mui/icons-material/Pause';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';

const Controls = ({ 
  isRecognizing, 
  statusMessage, 
  startRecognition, 
  stopRecognition, 
  speakTranslatedText,
  resetTranscript,
  pauseRecognition,
  audioLevel
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    if (isRecognizing) return 'success';
    if (statusMessage.includes('error') || statusMessage.includes('Error')) return 'error';
    return 'default';
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%',
        mb: 3,
        minHeight: '200px',
        background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(250, 250, 250, 0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white', display: 'flex', alignItems: 'center' }}>
        <KeyboardVoiceIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="h2">Speech Controls</Typography>
        <Box sx={{ ml: 'auto' }}>
          <Chip label={isRecognizing ? 'Active' : 'Idle'} size="small" color={isRecognizing ? 'success' : 'default'} />
        </Box>
      </Box>
      <Box sx={{ p: 3 }}>
        {/* Internal layout */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Button
              variant={isRecognizing ? "outlined" : "contained"}
              color={isRecognizing ? "error" : "primary"}
              onClick={isRecognizing ? stopRecognition : startRecognition}
              startIcon={isRecognizing ? <MicOffIcon /> : <MicIcon />}
            >
              {isRecognizing ? 'Stop' : 'Start'}
            </Button>
            {isRecognizing && (
              <Fade in={isRecognizing}>
                <LinearProgress variant="determinate" value={audioLevel} sx={{ mt: 2 }} />
              </Fade>
            )}
          </Box>
          <Box sx={{ flex: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Tooltip title="Speak translated text">
                <IconButton onClick={speakTranslatedText}><VolumeUpIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Reset transcript">
                <IconButton onClick={resetTranscript}><ReplayIcon /></IconButton>
              </Tooltip>
              {isRecognizing && (
                <Tooltip title="Pause recognition">
                  <IconButton onClick={pauseRecognition}><PauseIcon /></IconButton>
                </Tooltip>
              )}
            </Box>
            <Chip label={statusMessage || "Ready"} variant="outlined" color={getStatusColor()} sx={{ mt: 2, width: '100%' }} />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default Controls;