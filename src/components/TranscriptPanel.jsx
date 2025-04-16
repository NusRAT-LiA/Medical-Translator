import React, { useState } from 'react';
import { 
  Paper, 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Tooltip,
  CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MicIcon from '@mui/icons-material/Mic';
import TranslateIcon from '@mui/icons-material/Translate';
import ReplayIcon from '@mui/icons-material/Replay';


const TranscriptPanel = ({ originalTranscript, translatedTranscript, isListening = false, isTranslating = false ,outputLanguage,resetTranscript }) => {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // utterance.lang = tab === 0 ? 'en-US' : 'es-ES';
      utterance.lang = tab === 0 ? 'en-US': outputLanguage;
      speechSynthesis.speak(utterance);
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transcript-tabpanel-${index}`}
      aria-labelledby={`transcript-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={value === index}>
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );

  const getTabProps = (index) => ({
    id: `transcript-tab-${index}`,
    'aria-controls': `transcript-tabpanel-${index}`,
  });

  const getTabContent = (transcript, isLoading, loadingText) => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            {loadingText}
          </Typography>
        </Box>
      );
    } else if (!transcript) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {tab === 0 ? 'No transcript available yet' : 'No translation available yet'}
          </Typography>
        </Box>
      );
    }
    
    return (
      <>
        <Box sx={{ 
          minHeight: '200px', 
          maxHeight: '400px', 
          overflowY: 'auto', 
          borderRadius: 1,
          p: 2, 
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.divider,
            borderRadius: '4px',
          },
        }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {transcript}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
          <Tooltip title="Text-to-speech">
            <IconButton 
              size="small" 
              onClick={() => handleSpeak(transcript)}
              color="primary"
            >
              <VolumeUpIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
            <IconButton 
              size="small" 
              onClick={() => handleCopy(transcript)}
              color={copied ? "success" : "primary"}
            >
              {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
            </IconButton>
          </Tooltip>
           <Tooltip title="Reset transcript">
                <IconButton onClick={resetTranscript}><ReplayIcon /></IconButton>
           </Tooltip>
        </Box>
      </>
    );
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(250, 250, 250, 0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ 
        bgcolor: theme.palette.primary.main, 
        color: 'white',
        p: 2,
        display: 'flex',
        alignItems: 'center'
      }}>
        <TranslateIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="h2">
          Transcript
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: theme.palette.background.paper }}>
        <Tabs 
          value={tab} 
          onChange={(_, val) => setTab(val)}
          variant={isMobile ? "fullWidth" : "standard"}
          indicatorColor="primary"
          textColor="primary"
          aria-label="transcript tabs"
        >
          <Tab 
            icon={<MicIcon fontSize="small" />} 
            iconPosition="start" 
            label="Original Transcript" 
            {...getTabProps(0)} 
          />
          <Tab 
            icon={<TranslateIcon fontSize="small" />} 
            iconPosition="start" 
            label="Translated Transcript" 
            {...getTabProps(1)} 
          />
        </Tabs>
      </Box>
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TabPanel value={tab} index={0}>
          {getTabContent(originalTranscript, isListening, 'Listening...')}
        </TabPanel>
        
        <TabPanel value={tab} index={1}>
          {getTabContent(translatedTranscript, isTranslating, 'Translating...')}
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default TranscriptPanel;