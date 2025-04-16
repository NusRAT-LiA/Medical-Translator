import React, { useState, useEffect, useCallback } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Grid, 
  Box, 
  Paper,
  Typography,
  Alert,
  Snackbar,
  useMediaQuery,
  Backdrop,
  CircularProgress
} from '@mui/material';
import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import TranscriptPanel from './components/TranscriptPanel';
import Controls from './components/Controls';
import { darkTheme, lightTheme } from './themes/theme';

// // Speech recognition service
// import SpeechRecognitionService from './services/SpeechRecognitionService';
// // Translation service
// import TranslationService from './services/TranslationService';

const App = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // App state
  const [inputLanguage, setInputLanguage] = useState('en-US');
  const [outputLanguage, setOutputLanguage] = useState('es-ES');
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize services (placeholder for actual implementation)
  const speechRecognition = new SpeechRecognitionService();
  const translator = new TranslationService();
  
  // Effect to set initial theme based on system preference
  useEffect(() => {
    if (localStorage.getItem('darkMode') === null) {
      setDarkMode(prefersDarkMode);
    }
  }, [prefersDarkMode]);
  
  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Toggle theme
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, []);

  // Reset transcripts
  const resetTranscript = useCallback(() => {
    setOriginalTranscript('');
    setTranslatedTranscript('');
    setInterimTranscript('');
    setNotification({
      open: true,
      message: 'Transcripts cleared',
      severity: 'info'
    });
  }, []);

  // Start speech recognition
  const startRecognition = useCallback(() => {
    try {
      setIsLoading(true);
      setIsRecognizing(true);
      setStatusMessage('Listening...');
      
      // Simulated implementation - replace with actual speech recognition
      speechRecognition.start({
        language: inputLanguage,
        onResult: (result) => {
          setOriginalTranscript(result.final);
          setInterimTranscript(result.interim);
          setAudioLevel(result.audioLevel);
          
          // Auto-translate when we have final text
          if (result.final && result.final !== originalTranscript) {
            translateText(result.final);
          }
        },
        onError: (error) => {
          setError(error);
          setStatusMessage(`Error: ${error.message}`);
          setIsRecognizing(false);
        }
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setError(error);
      setStatusMessage(`Failed to start: ${error.message}`);
      setIsRecognizing(false);
      setIsLoading(false);
    }
  }, [inputLanguage, originalTranscript, speechRecognition]);

  // Stop speech recognition
  const stopRecognition = useCallback(() => {
    speechRecognition.stop();
    setIsRecognizing(false);
    setIsPaused(false);
    setStatusMessage('Recognition stopped');
    setAudioLevel(0);
  }, [speechRecognition]);

  // Pause speech recognition
  const pauseRecognition = useCallback(() => {
    speechRecognition.pause();
    setIsPaused(true);
    setStatusMessage('Recognition paused');
  }, [speechRecognition]);

  // Translate text
  const translateText = useCallback(async (text) => {
    if (!text) return;
    
    try {
      setIsTranslating(true);
      
      // Simulated implementation - replace with actual translation
      const result = await translator.translate(text, {
        from: inputLanguage,
        to: outputLanguage
      });
      
      setTranslatedTranscript(result.translatedText);
      setIsTranslating(false);
    } catch (error) {
      console.error("Translation error:", error);
      setError(error);
      setNotification({
        open: true,
        message: `Translation error: ${error.message}`,
        severity: 'error'
      });
      setIsTranslating(false);
    }
  }, [inputLanguage, outputLanguage, translator]);

  // Speak translated text
  const speakTranslatedText = useCallback(() => {
    if (!translatedTranscript) {
      setNotification({
        open: true,
        message: 'No translated text to speak',
        severity: 'warning'
      });
      return;
    }
    
    setStatusMessage('Speaking...');
    
    // Text-to-speech implementation
    const utterance = new SpeechSynthesisUtterance(translatedTranscript);
    utterance.lang = outputLanguage;
    
    utterance.onend = () => {
      setStatusMessage(isRecognizing ? 'Listening...' : '');
    };
    
    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error);
      setStatusMessage(`Speech error: ${error.message}`);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [translatedTranscript, outputLanguage, isRecognizing]);

  // Handle language change
  const handleLanguageChange = useCallback((type, value) => {
    if (isRecognizing) {
      stopRecognition();
    }
    
    if (type === 'input') {
      setInputLanguage(value);
      setOriginalTranscript('');
      setInterimTranscript('');
    } else {
      setOutputLanguage(value);
      setTranslatedTranscript('');
    }
    
    setNotification({
      open: true,
      message: `${type === 'input' ? 'Input' : 'Output'} language changed to ${value}`,
      severity: 'info'
    });
  }, [isRecognizing, stopRecognition]);

  // Close notification
  const handleCloseNotification = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: (theme) => theme.palette.background.default
        }}
      >
        <Header 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          title="Speech Translator"
        />

        <Container 
          maxWidth="lg" 
          sx={{ 
            mt: { xs: 2, sm: 4 }, 
            mb: { xs: 2, sm: 4 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              onClose={clearError}
              sx={{ mb: 3 }}
            >
              {error.message || 'An error occurred'}
            </Alert>
          )}
          
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'transparent'
            }}
          >
            <Grid container spacing={3} sx={{ flex: 1, justifyContent: 'center' }}>
              <Grid item xs={12}>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 2,
                    textAlign: { xs: 'center', md: 'center' }
                  }}
                >
                  Real-time Speech Translation
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ 
                    mb: 4,
                    textAlign: { xs: 'center', md: 'left' }
                  }}
                >
                  Translate speech in real-time between multiple languages
                </Typography>
              </Grid>
              
              {/* Main content layout */}
              <Grid container item spacing={3}>
                {/* Left column */}
                <LanguageSelector
                  inputLanguage={inputLanguage}
                  outputLanguage={outputLanguage}
                  setInputLanguage={(value) => handleLanguageChange('input', value)}
                  setOutputLanguage={(value) => handleLanguageChange('output', value)}
                />
                <Controls
                isRecognizing={isRecognizing}
                isPaused={isPaused}
                statusMessage={statusMessage}
                startRecognition={startRecognition}
                stopRecognition={stopRecognition}
                pauseRecognition={pauseRecognition}
                speakTranslatedText={speakTranslatedText}
                resetTranscript={resetTranscript}
                audioLevel={audioLevel}
              />
    
                {/* Right column */}
                <TranscriptPanel
                  originalTranscript={originalTranscript}
                  translatedTranscript={translatedTranscript}
                  interimText={interimTranscript}
                  isListening={isRecognizing && !isPaused}
                  isTranslating={isTranslating}
                />
              </Grid>
        
            </Grid>
          </Paper>
        </Container>
        
        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 3, 
            px: 2, 
            mt: 'auto',
            textAlign: 'center',
            bgcolor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.03)',
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Speech Translator © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          elevation={6}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Loading overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </ThemeProvider>
  );
};

// Simulated service implementations (to be replaced with actual implementations)
class SpeechRecognitionService {
  constructor() {
    this.isRunning = false;
  }
  
  start({ language, onResult, onError }) {
    this.isRunning = true;
    console.log(`Started speech recognition in ${language}`);
    // Simulate recognition
    this.interval = setInterval(() => {
      if (this.isRunning) {
        onResult({
          final: "This is a simulated transcript.",
          interim: "This is...",
          audioLevel: Math.random() * 100
        });
      }
    }, 2000);
  }
  
  stop() {
    this.isRunning = false;
    clearInterval(this.interval);
    console.log("Stopped speech recognition");
  }
  
  pause() {
    this.isRunning = false;
    console.log("Paused speech recognition");
  }
}

class TranslationService {
  async translate(text, { from, to }) {
    console.log(`Translating from ${from} to ${to}: ${text}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      translatedText: `Translated: ${text}`
    };
  }
}

export default App;