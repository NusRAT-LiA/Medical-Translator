// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   ThemeProvider, 
//   CssBaseline, 
//   Container, 
//   Grid, 
//   Box, 
//   Paper,
//   Typography,
//   Alert,
//   Snackbar,
//   useMediaQuery,
//   Backdrop,
//   CircularProgress
// } from '@mui/material';
// import Header from './components/Header';
// import LanguageSelector from './components/LanguageSelector';
// import TranscriptPanel from './components/TranscriptPanel';
// import Controls from './components/Controls';
// import { darkTheme, lightTheme } from './themes/theme';

// // Google Gemini API key for medical term enhancement
// const GOOGLE_AI_API_KEY = "YOUR_GOOGLE_API_KEY"; // Replace with your actual API key
// const MEDICAL_TERMS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// const App = () => {
//   // Theme state
//   const [darkMode, setDarkMode] = useState(() => {
//     const savedMode = localStorage.getItem('darkMode');
//     return savedMode ? JSON.parse(savedMode) : false;
//   });
//   const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
//   // App state
//   const [inputLanguage, setInputLanguage] = useState('en-US');
//   const [outputLanguage, setOutputLanguage] = useState('es-ES');
//   const [originalTranscript, setOriginalTranscript] = useState('');
//   const [interimTranscript, setInterimTranscript] = useState('');
//   const [translatedTranscript, setTranslatedTranscript] = useState('');
//   const [isRecognizing, setIsRecognizing] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const [statusMessage, setStatusMessage] = useState('');
//   const [audioLevel, setAudioLevel] = useState(0);
//   const [isTranslating, setIsTranslating] = useState(false);
//   const [error, setError] = useState(null);
//   const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEnhancing, setIsEnhancing] = useState(false);

//   // Real Web Speech API implementation
//   class SpeechRecognitionService {
//     constructor() {
//       this.recognition = null;
//       this.isRunning = false;
//       this.initRecognition();
//     }
    
//     initRecognition() {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (!SpeechRecognition) {
//         throw new Error("Speech recognition not supported in this browser");
//       }
      
//       this.recognition = new SpeechRecognition();
//       this.recognition.continuous = true;
//       this.recognition.interimResults = true;
//     }
    
//     start({ language, onResult, onError }) {
//       if (!this.recognition) {
//         this.initRecognition();
//       }
      
//       this.recognition.lang = language;
//       this.isRunning = true;
      
//       // Set up event listeners
//       this.recognition.onresult = (event) => {
//         let interimTranscript = '';
//         let finalTranscript = '';
        
//         // Calculate audio level (approximation based on recent speech)
//         const audioLevel = event.results.length > 0 ? 
//           Math.min(100, event.results[event.results.length - 1][0].confidence * 100) : 0;
        
//         // Process results
//         for (let i = 0; i < event.results.length; i++) {
//           const transcript = event.results[i][0].transcript;
//           if (event.results[i].isFinal) {
//             finalTranscript += transcript + ' ';
//           } else {
//             interimTranscript += transcript;
//           }
//         }
        
//         onResult({
//           final: finalTranscript.trim(),
//           interim: interimTranscript,
//           audioLevel: audioLevel
//         });
//       };
      
//       this.recognition.onerror = (event) => {
//         onError({
//           message: event.error || "Unknown speech recognition error"
//         });
//       };
      
//       this.recognition.onend = () => {
//         if (this.isRunning) {
//           // Restart if it ended unexpectedly while still running
//           this.recognition.start();
//         }
//       };
      
//       try {
//         this.recognition.start();
//       } catch (e) {
//         onError({
//           message: "Failed to start speech recognition: " + e.message
//         });
//       }
//     }
    
//     stop() {
//       if (this.recognition) {
//         this.isRunning = false;
//         this.recognition.stop();
//       }
//     }
    
//     pause() {
//       if (this.recognition) {
//         this.isRunning = false;
//         this.recognition.stop();
//       }
//     }
//   }

//   // Translation service with Google Translation API
//   class TranslationService {
//     async translate(text, { from, to }) {
//       try {
//         // Extract base language code (e.g., 'en' from 'en-US')
//         const sourceLanguage = from.split('-')[0];
//         const targetLanguage = to.split('-')[0];
        
//         // Use Google Translation API
//         const encodedText = encodeURIComponent(text);
//         const response = await fetch(
//           `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_AI_API_KEY}`,
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               q: text,
//               source: sourceLanguage,
//               target: targetLanguage,
//               format: 'text'
//             })
//           }
//         );
        
//         const data = await response.json();
        
//         if (data.error) {
//           throw new Error(data.error.message || "Translation failed");
//         }
        
//         if (data.data && data.data.translations && data.data.translations.length > 0) {
//           return {
//             translatedText: data.data.translations[0].translatedText
//           };
//         } else {
//           // Fallback for development/testing when API fails
//           console.warn("Translation API returned unexpected format, using fallback");
//           return {
//             translatedText: `[Translated to ${targetLanguage}]: ${text}`
//           };
//         }
//       } catch (error) {
//         console.error("Translation API error:", error);
//         // Fallback for when API is unavailable
//         return {
//           translatedText: `[Translation error, please try again]`
//         };
//       }
//     }
//   }
  
//   // Initialize services
//   const speechRecognition = new SpeechRecognitionService();
//   const translator = new TranslationService();
  
//   // Effect to set initial theme based on system preference
//   useEffect(() => {
//     if (localStorage.getItem('darkMode') === null) {
//       setDarkMode(prefersDarkMode);
//     }
//   }, [prefersDarkMode]);
  
//   // Save theme preference to localStorage
//   useEffect(() => {
//     localStorage.setItem('darkMode', JSON.stringify(darkMode));
//   }, [darkMode]);

//   // Toggle theme
//   const toggleDarkMode = useCallback(() => {
//     setDarkMode(prevMode => !prevMode);
//   }, []);

//   // Reset transcripts
//   const resetTranscript = useCallback(() => {
//     setOriginalTranscript('');
//     setTranslatedTranscript('');
//     setInterimTranscript('');
//     setNotification({
//       open: true,
//       message: 'Transcripts cleared',
//       severity: 'info'
//     });
//   }, []);

//   // Enhance medical terms using Gemini API
//   const enhanceMedicalTerms = useCallback(async (text) => {
//     if (!text) return text;
    
//     try {
//       setIsEnhancing(true);
      
//       const response = await fetch(MEDICAL_TERMS_ENDPOINT, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "x-goog-api-key": GOOGLE_AI_API_KEY
//         },
//         body: JSON.stringify({
//           contents: [{
//             parts: [{
//               text: `You are a medical transcription assistant. Please correct and enhance any medical terms in the following text, while keeping the overall meaning intact: "${text}"`
//             }]
//           }],
//           generationConfig: {
//             temperature: 0.2,
//             maxOutputTokens: 1000
//           }
//         })
//       });
      
//       const data = await response.json();
      
//       // Check if we got valid response data
//       if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
//         setIsEnhancing(false);
//         return data.candidates[0].content.parts[0].text;
//       } else {
//         console.warn("Medical term enhancement returned unexpected format", data);
//         setIsEnhancing(false);
//         return text; // Return original if enhancement fails
//       }
//     } catch (error) {
//       console.error("Error enhancing medical terms:", error);
//       setIsEnhancing(false);
//       return text; // Return original on error
//     }
//   }, []);

//   // Start speech recognition
//   const startRecognition = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setIsRecognizing(true);
//       setStatusMessage('Listening...');
      
//       speechRecognition.start({
//         language: inputLanguage,
//         onResult: async (result) => {
//           // Update interim results immediately
//           setInterimTranscript(result.interim);
//           setAudioLevel(result.audioLevel);
          
//           // Process final results
//           if (result.final && result.final !== originalTranscript) {
//             // Enhance medical terms in the transcript
//             const enhancedText = await enhanceMedicalTerms(result.final);
//             setOriginalTranscript(enhancedText);
            
//             // Auto-translate enhanced text
//             translateText(enhancedText);
//           }
//         },
//         onError: (error) => {
//           setError(error);
//           setStatusMessage(`Error: ${error.message}`);
//           setIsRecognizing(false);
//         }
//       });
      
//       setIsLoading(false);
//     } catch (error) {
//       console.error("Failed to start recognition:", error);
//       setError(error);
//       setStatusMessage(`Failed to start: ${error.message}`);
//       setIsRecognizing(false);
//       setIsLoading(false);
//     }
//   }, [inputLanguage, originalTranscript, enhanceMedicalTerms]);

//   // Stop speech recognition
//   const stopRecognition = useCallback(() => {
//     speechRecognition.stop();
//     setIsRecognizing(false);
//     setIsPaused(false);
//     setStatusMessage('Recognition stopped');
//     setAudioLevel(0);
//   }, [speechRecognition]);

//   // Pause speech recognition
//   const pauseRecognition = useCallback(() => {
//     speechRecognition.pause();
//     setIsPaused(true);
//     setStatusMessage('Recognition paused');
//   }, [speechRecognition]);

//   // Translate text
//   const translateText = useCallback(async (text) => {
//     if (!text) return;
    
//     try {
//       setIsTranslating(true);
      
//       const result = await translator.translate(text, {
//         from: inputLanguage,
//         to: outputLanguage
//       });
      
//       setTranslatedTranscript(result.translatedText);
//       setIsTranslating(false);
//     } catch (error) {
//       console.error("Translation error:", error);
//       setError(error);
//       setNotification({
//         open: true,
//         message: `Translation error: ${error.message}`,
//         severity: 'error'
//       });
//       setIsTranslating(false);
//     }
//   }, [inputLanguage, outputLanguage, translator]);

//   // Speak translated text
//   const speakTranslatedText = useCallback(() => {
//     if (!translatedTranscript) {
//       setNotification({
//         open: true,
//         message: 'No translated text to speak',
//         severity: 'warning'
//       });
//       return;
//     }
    
//     setStatusMessage('Speaking...');
    
//     // Text-to-speech implementation
//     const utterance = new SpeechSynthesisUtterance(translatedTranscript);
//     utterance.lang = outputLanguage;
    
//     utterance.onend = () => {
//       setStatusMessage(isRecognizing ? 'Listening...' : '');
//     };
    
//     utterance.onerror = (error) => {
//       console.error("Speech synthesis error:", error);
//       setStatusMessage(`Speech error: ${error.message}`);
//     };
    
//     window.speechSynthesis.speak(utterance);
//   }, [translatedTranscript, outputLanguage, isRecognizing]);

//   // Handle language change
//   const handleLanguageChange = useCallback((type, value) => {
//     if (isRecognizing) {
//       stopRecognition();
//     }
    
//     if (type === 'input') {
//       setInputLanguage(value);
//       setOriginalTranscript('');
//       setInterimTranscript('');
//     } else {
//       setOutputLanguage(value);
//       setTranslatedTranscript('');
//     }
    
//     setNotification({
//       open: true,
//       message: `${type === 'input' ? 'Input' : 'Output'} language changed to ${value}`,
//       severity: 'info'
//     });
//   }, [isRecognizing, stopRecognition]);

//   // Close notification
//   const handleCloseNotification = useCallback((event, reason) => {
//     if (reason === 'clickaway') return;
//     setNotification(prev => ({ ...prev, open: false }));
//   }, []);

//   // Clear error
//   const clearError = useCallback(() => {
//     setError(null);
//   }, []);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (isRecognizing) {
//         speechRecognition.stop();
//       }
//     };
//   }, [isRecognizing]);

//   return (
//     <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
//       <CssBaseline />
//       <Box 
//         sx={{
//           minHeight: '100vh',
//           display: 'flex',
//           flexDirection: 'column',
//           bgcolor: (theme) => theme.palette.background.default
//         }}
//       >
//         <Header 
//           darkMode={darkMode} 
//           toggleDarkMode={toggleDarkMode} 
//           title="Medical Speech Translator"
//         />

//         <Container 
//           maxWidth="lg" 
//           sx={{ 
//             mt: { xs: 2, sm: 4 }, 
//             mb: { xs: 2, sm: 4 },
//             flex: 1,
//             display: 'flex',
//             flexDirection: 'column'
//           }}
//         >
//           {error && (
//             <Alert 
//               severity="error" 
//               onClose={clearError}
//               sx={{ mb: 3 }}
//             >
//               {error.message || 'An error occurred'}
//             </Alert>
//           )}
          
//           <Paper 
//             elevation={0} 
//             sx={{ 
//               borderRadius: 3,
//               overflow: 'hidden',
//               flex: 1,
//               display: 'flex',
//               flexDirection: 'column',
//               bgcolor: 'transparent'
//             }}
//           >
//             <Grid container spacing={3} sx={{ flex: 1, justifyContent: 'center' }}>
//               <Grid item xs={12}>
//                 <Typography 
//                   variant="h4" 
//                   component="h1" 
//                   sx={{ 
//                     fontWeight: 'bold',
//                     mb: 2,
//                     textAlign: { xs: 'center', md: 'center' }
//                   }}
//                 >
//                   Medical Speech Translation
//                 </Typography>
//                 <Typography 
//                   variant="body1" 
//                   color="text.secondary"
//                   sx={{ 
//                     mb: 4,
//                     textAlign: { xs: 'center', md: 'left' }
//                   }}
//                 >
//                   Translate medical speech in real-time with enhanced terminology accuracy
//                 </Typography>
//               </Grid>
              
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={6}>
//                   <LanguageSelector
//                     inputLanguage={inputLanguage}
//                     outputLanguage={outputLanguage}
//                     setInputLanguage={(value) => handleLanguageChange('input', value)}
//                     setOutputLanguage={(value) => handleLanguageChange('output', value)}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Controls
//                     isRecognizing={isRecognizing}
//                     isPaused={isPaused}
//                     statusMessage={statusMessage}
//                     startRecognition={startRecognition}
//                     stopRecognition={stopRecognition}
//                     pauseRecognition={pauseRecognition}
//                     speakTranslatedText={speakTranslatedText}
//                     resetTranscript={resetTranscript}
//                     audioLevel={audioLevel}
//                   />
//                 </Grid>
//                 <Grid item xs={12}>
//                   <TranscriptPanel
//                     originalTranscript={originalTranscript}
//                     translatedTranscript={translatedTranscript}
//                     interimText={interimTranscript}
//                     isListening={isRecognizing && !isPaused}
//                     isTranslating={isTranslating || isEnhancing}
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>
//           </Paper>
//         </Container>
        
//         {/* Footer */}
//         <Box 
//           component="footer" 
//           sx={{ 
//             py: 3, 
//             px: 2, 
//             mt: 'auto',
//             textAlign: 'center',
//             bgcolor: (theme) => theme.palette.mode === 'dark' 
//               ? 'rgba(255, 255, 255, 0.05)' 
//               : 'rgba(0, 0, 0, 0.03)',
//             borderTop: 1,
//             borderColor: 'divider'
//           }}
//         >
//           <Typography variant="body2" color="text.secondary">
//             Medical Speech Translator © {new Date().getFullYear()}
//           </Typography>
//         </Box>
//       </Box>
      
//       {/* Notifications */}
//       <Snackbar
//         open={notification.open}
//         autoHideDuration={4000}
//         onClose={handleCloseNotification}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//       >
//         <Alert 
//           onClose={handleCloseNotification} 
//           severity={notification.severity}
//           elevation={6}
//           variant="filled"
//         >
//           {notification.message}
//         </Alert>
//       </Snackbar>
      
//       {/* Loading overlay */}
//       <Backdrop
//         sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
//         open={isLoading}
//       >
//         <CircularProgress color="inherit" />
//       </Backdrop>
//     </ThemeProvider>
//   );
// };

// export default App;


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
import Header from './components/Header'; // Assuming these components exist
import LanguageSelector from './components/LanguageSelector'; // Assuming these components exist
import TranscriptPanel from './components/TranscriptPanel'; // Assuming these components exist
import Controls from './components/Controls'; // Assuming these components exist
import { darkTheme, lightTheme } from './themes/theme'; // Assuming these exist

// --- IMPORTANT ---
// 1. Ensure this API key is valid and enabled for "Generative Language API"
//    in your Google Cloud Console / AI Studio.
// 2. For production, use a secure backend proxy for the API key.
const GOOGLE_AI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // <--- REPLACE WITH YOUR ACTUAL KEY
// --- END IMPORTANT ---

// Single Gemini API endpoint for all tasks
// const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?";


// REMOVED: const TRANSLATE_API_ENDPOINT = ...

// Helper function to get language name from code (for better prompts)
const getLanguageName = (code) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code.split('-')[0]);
  } catch (e) {
    console.warn(`Could not get display name for language code: ${code}`, e);
    return code.split('-')[0]; // Fallback to base code
  }
};


const App = () => {
  // --- State Variables ---
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [inputLanguage, setInputLanguage] = useState('en-US');
  const [outputLanguage, setOutputLanguage] = useState('es-ES');
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false); // Will be set when Gemini is translating
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false); // Will be set when Gemini is enhancing

  // --- Speech Recognition Service (Web Speech API - No changes) ---
  class SpeechRecognitionService {
      constructor() {
        this.recognition = null;
        this.isRunning = false;
        // Defer initialization
      }
      
      initRecognition() {
        if (this.recognition) return true;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setError({ message: "Speech recognition not supported." }); return false;
        }
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = true; this.recognition.interimResults = true; return true;
        } catch (e) {
           setError({ message: `SpeechRecognition init failed: ${e.message}` }); return false;
        }
      }
      
      start({ language, onResult, onError, onEnd }) { 
         if (!this.initRecognition()) { onError({ message: "Speech recognition init failed." }); return; }
        this.recognition.lang = language; this.isRunning = true;
        this.recognition.onresult = (event) => {
          let finalTranscriptSegment = '', currentInterimTranscript = '', calculatedAudioLevel = 0;
          if (event.results.length > 0) {
              const lastResult = event.results[event.results.length - 1];
              if (lastResult?.[0]?.confidence) calculatedAudioLevel = Math.min(100, Math.max(0, Math.round(lastResult[0].confidence * 120)));
          }
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscriptSegment += event.results[i][0].transcript + ' ';
            else currentInterimTranscript += event.results[i][0].transcript;
          }
          onResult({ finalSegment: finalTranscriptSegment.trim(), interim: currentInterimTranscript, audioLevel: calculatedAudioLevel });
        };
        this.recognition.onerror = (event) => {
          let errMsg = event.error || "Unknown speech error";
          if (event.error === 'network') errMsg = "Network error during speech recognition.";
          else if (event.error === 'no-speech') errMsg = "No speech detected.";
          else if (event.error === 'audio-capture') errMsg = "Microphone audio capture error.";
          else if (event.error === 'not-allowed') errMsg = "Microphone permission denied.";
          else if (event.error === 'aborted') errMsg = "Speech recognition aborted."; 
          onError({ message: errMsg }); this.isRunning = false; 
        };
        this.recognition.onend = () => { this.isRunning = false; if (onEnd) onEnd(); };
        try { this.recognition.start(); }
        catch (e) { onError({ message: `Failed to start recognition: ${e.message}.` }); this.isRunning = false; }
      }
      stop() { if (this.recognition && this.isRunning) { this.isRunning = false; this.recognition.stop(); } }
      pause() { if (this.recognition && this.isRunning) { this.isRunning = false; this.recognition.stop(); } }
    }


  // --- REMOVED: TranslationService class ---

  // --- Initialize Speech Recognition Service ---
  const speechRecognitionRef = React.useRef(null);
  // REMOVED: const translatorRef = React.useRef(null);

  useEffect(() => {
      if (!speechRecognitionRef.current) {
          speechRecognitionRef.current = new SpeechRecognitionService();
      }
      // REMOVED: translatorRef initialization
  }, []);


  // --- Theme Effects (no changes) ---
  useEffect(() => {
    if (localStorage.getItem('darkMode') === null) setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  const toggleDarkMode = useCallback(() => setDarkMode(prevMode => !prevMode), []);

  // --- Transcript Reset (no changes) ---
  const resetTranscript = useCallback(() => {
    setOriginalTranscript(''); setTranslatedTranscript(''); setInterimTranscript('');
    setNotification({ open: true, message: 'Transcripts cleared', severity: 'info' });
  }, []);

  // --- Gemini API Call Helper ---
  const callGeminiAPI = useCallback(async (prompt, taskDescription) => {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY === "YOUR_GOOGLE_API_KEY") {
        const errorMsg = `Gemini API call skipped for ${taskDescription}: API key missing.`;
        console.error(errorMsg);
        setError({ message: errorMsg });
        throw new Error(errorMsg); // Throw to stop further processing
    }

    console.log(`Calling Gemini for ${taskDescription}... Prompt:`, prompt); // Log the prompt

    try {
        const response = await fetch(GEMINI_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GOOGLE_AI_API_KEY
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                // Adjust config as needed per task
                generationConfig: {
                    temperature: 0.3, // Slightly higher temp might be okay for translation
                    maxOutputTokens: 2048, // Allow longer output for translation
                },
                 // Add safety settings if needed
                 safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                  ]
            })
        });

        const data = await response.json();
        console.log(`Gemini response for ${taskDescription}:`, data); // Log the full response

        if (!response.ok) {
            const errorDetail = data.error ? data.error.message : `Gemini API HTTP error ${response.status}`;
            console.error(`Gemini API error (${taskDescription}):`, errorDetail, data);
            throw new Error(`Gemini API error (${taskDescription}): ${errorDetail}`);
        }

        // Check for blocks before accessing candidates
        if (data.promptFeedback?.blockReason) {
            const blockReason = data.promptFeedback.blockReason;
            console.error(`Gemini prompt blocked (${taskDescription}): ${blockReason}`);
             throw new Error(`Gemini prompt blocked for ${taskDescription} due to: ${blockReason}`);
        }
         if (!data.candidates || data.candidates.length === 0) {
             // Sometimes the response is 200 OK but has no candidates, check finishReason
              const finishReason = data.promptFeedback?.candidates?.[0]?.finishReason || 'UNKNOWN';
             if (finishReason === 'SAFETY') {
                 console.error(`Gemini response blocked for safety (${taskDescription}).`);
                  throw new Error(`Gemini response blocked for ${taskDescription} due to safety settings.`);
             } else {
                  console.error(`Gemini API error (${taskDescription}): No candidates returned. Finish reason: ${finishReason}`, data);
                  throw new Error(`Gemini API error (${taskDescription}): No candidates returned.`);
             }
         }


        const resultText = data.candidates[0]?.content?.parts?.[0]?.text;

        if (resultText) {
            return resultText.trim();
        } else {
            // Handle cases where the structure is unexpected even with candidates
            console.warn(`Gemini (${taskDescription}) returned unexpected format or no text:`, data);
             if (data.candidates[0]?.finishReason === 'SAFETY') {
                  throw new Error(`Gemini response blocked for ${taskDescription} due to safety settings.`);
             }
            throw new Error(`Gemini API error (${taskDescription}): Could not extract text from response.`);
        }
    } catch (error) {
        console.error(`Error calling Gemini API for ${taskDescription}:`, error);
         // Don't set state here, let the calling function handle it
         throw error; // Re-throw the error
    }
  }, [GOOGLE_AI_API_KEY]); // Dependency on API key


  // --- Enhance Medical Terms using Gemini ---
  const enhanceMedicalTerms = useCallback(async (text) => {
    if (!text) return text;

    setIsEnhancing(true);
    setStatusMessage('Enhancing terms...');

    const prompt = `You are an expert medical transcription assistant. Review the following text which is part of a real-time transcription. 
    Task: Correct any misheard or misspelled medical terms (like drugs, conditions, procedures, anatomy). Improve formatting for clarity (e.g., proper capitalization of medical terms). Crucially, keep the overall meaning and all non-medical parts of the text *exactly* the same. Only output the corrected text, nothing else.
    Text: "${text}"
    Corrected Text:`;

    try {
        const enhancedText = await callGeminiAPI(prompt, "Medical Enhancement");
        console.log("Original:", text);
        console.log("Enhanced:", enhancedText);
        return enhancedText;
    } catch (error) {
        setError({ message: `Medical term enhancement failed: ${error.message}` });
        // Fallback to original text on error
        return text;
    } finally {
        setIsEnhancing(false);
        // Status message will be updated by the next step or end state
    }
  }, [callGeminiAPI]); // Depends on the generic API caller


  // --- NEW: Translate Text using Gemini ---
  const translateTextWithGemini = useCallback(async (textToTranslate, fromLangCode, toLangCode) => {
    if (!textToTranslate) return ''; // Return empty if no text

    // Skip if languages are the same
    const sourceBaseLang = fromLangCode.split('-')[0];
    const targetBaseLang = toLangCode.split('-')[0];
    if (sourceBaseLang === targetBaseLang) {
        return textToTranslate;
    }

    setIsTranslating(true);
    setStatusMessage('Translating...');

    const sourceLangName = getLanguageName(fromLangCode);
    const targetLangName = getLanguageName(toLangCode);

    // Finely crafted prompt for translation
    const prompt = `Act as a professional translator who has expertise in medical terms. Translate the following text accurately from ${sourceLangName} (${sourceBaseLang}) to ${targetLangName} (${targetBaseLang}). Preserve the original meaning and tone as much as possible. Output *only* the translated text, without any introduction, explanation, or quotation marks around the result.

    Source Text (${sourceLangName}): "${textToTranslate}"

    Translated Text (${targetLangName}):`;


    try {
        const translatedTextResult = await callGeminiAPI(prompt, "Translation");
        console.log("Text to Translate:", textToTranslate);
        console.log("Translated:", translatedTextResult);
        setTranslatedTranscript(translatedTextResult); // Update state on success
        return translatedTextResult; // Return for potential chaining
    } catch (error) {
        setError({ message: `Translation failed: ${error.message}` });
        setTranslatedTranscript('[Translation Failed]'); // Show failure in UI
        return ''; // Return empty on failure
    } finally {
        setIsTranslating(false);
        // Restore status message based on recognition state after translation finishes
         setStatusMessage(isRecognizing ? (isPaused ? 'Paused' : 'Listening...') : 'Idle');
    }
  }, [callGeminiAPI, isRecognizing, isPaused]); // Depends on API caller and recognition state


  // --- Start Speech Recognition (Workflow Updated) ---
  const startRecognition = useCallback(async () => {

    if (!speechRecognitionRef.current) { setError({ message: "Speech Recognition service unavailable." }); return; }
    if (isRecognizing) return;

    clearError(); setIsLoading(true); setStatusMessage('Initializing...');

    try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (permissionError) {
        setError({ message: "Microphone access denied. Please allow permission." });
        setStatusMessage('Permission denied'); setIsLoading(false); return;
    }

    setIsRecognizing(true); setIsPaused(false); setStatusMessage('Listening...');

    speechRecognitionRef.current.start({
      language: inputLanguage,
      onResult: async ({ finalSegment, interim, audioLevel }) => {
        setInterimTranscript(interim);
        if (audioLevel !== undefined) setAudioLevel(audioLevel);

        if (finalSegment) {
          setInterimTranscript(''); // Clear interim now

          // --- Step 1: Enhance the new segment ---
          const enhancedSegment = await enhanceMedicalTerms(finalSegment);
          // Append enhanced segment to the full transcript immediately for display
          const updatedOriginalTranscript = originalTranscript + enhancedSegment + ' ';
          setOriginalTranscript(updatedOriginalTranscript);

          // --- Step 2: Translate the *entire updated* transcript ---
          // We translate the whole thing to maintain context in translation
           await translateTextWithGemini(updatedOriginalTranscript, inputLanguage, outputLanguage);
          // State for translated transcript is updated inside translateTextWithGemini
        }
      },
      onError: (err) => {
        setError(err); setStatusMessage(`Error: ${err.message}`);
        setIsRecognizing(false); setIsPaused(false); setAudioLevel(0); setIsLoading(false);
        setIsEnhancing(false); setIsTranslating(false); // Ensure flags reset on error
      },
      onEnd: () => {
         setStatusMessage(isPaused ? 'Paused' : 'Recognition stopped');
         setIsRecognizing(false); setAudioLevel(0); setIsLoading(false);
         setIsEnhancing(false); setIsTranslating(false); // Ensure flags reset on end
      }
    });

    setTimeout(() => setIsLoading(false), 300);

  // Added translateTextWithGemini dependency
  }, [inputLanguage, outputLanguage, originalTranscript, enhanceMedicalTerms, translateTextWithGemini, isRecognizing, isPaused]);


  // --- Stop Speech Recognition (no major changes) ---
  const stopRecognition = useCallback(() => {
    if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop(); // Triggers onEnd
    }
    setIsPaused(false);
    if (interimTranscript) {
        // Optionally process the last interim bit here
        // enhanceMedicalTerms(interimTranscript).then(enhanced => {
        //    const finalTranscript = originalTranscript + enhanced + ' ';
        //    setOriginalTranscript(finalTranscript);
        //    translateTextWithGemini(finalTranscript, inputLanguage, outputLanguage);
        // });
         setInterimTranscript(''); // Clear for now
    }
    // Status updates handled by onEnd
  }, [interimTranscript, originalTranscript, inputLanguage, outputLanguage, enhanceMedicalTerms, translateTextWithGemini]);


  // --- Pause Speech Recognition (no major changes) ---
  const pauseRecognition = useCallback(() => {
    if (isRecognizing && !isPaused) {
      setIsPaused(true); setStatusMessage('Pausing...');
       if (speechRecognitionRef.current) { speechRecognitionRef.current.pause(); } // Triggers onEnd
    }
  }, [isRecognizing, isPaused]);


  // --- Speak Translated Text (Web Speech API - no changes) ---
  const speakTranslatedText = useCallback(() => {
    if (!translatedTranscript || isTranslating || isEnhancing) { // Check both flags
      setNotification({ open: true, message: 'No translated text available or AI processing.', severity: 'warning' }); return;
    }
    window.speechSynthesis.cancel(); setStatusMessage('Speaking...');
    const utterance = new SpeechSynthesisUtterance(translatedTranscript);
    const targetLang = outputLanguage.split('-')[0];
    utterance.lang = targetLang;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(targetLang));
    if (voice) utterance.voice = voice;
    utterance.onend = () => { setStatusMessage(isRecognizing ? (isPaused ? 'Paused' : 'Listening...') : 'Idle'); };
    utterance.onerror = (event) => { setError({ message: `Speech error: ${event.error}` }); setStatusMessage(`Speech error`); };
    if (voices.length === 0) window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.speak(utterance);
    else window.speechSynthesis.speak(utterance);
  }, [translatedTranscript, outputLanguage, isRecognizing, isPaused, isTranslating, isEnhancing]);


  // --- Handle Language Change (Uses new translate function) ---
  const handleLanguageChange = useCallback((type, value) => {
    if (isRecognizing) stopRecognition();

    if (type === 'input') {
      setInputLanguage(value);
      resetTranscript(); // Reset all on input change
    } else { // Output language changed
      setOutputLanguage(value);
      setTranslatedTranscript(''); // Clear previous translation
      // If original text exists, re-translate it to the new language
      if (originalTranscript) {
        // Use the new Gemini translation function
        translateTextWithGemini(originalTranscript, inputLanguage, value);
      }
    }
    setNotification({ open: true, message: `${type === 'input' ? 'Input' : 'Output'} language set to ${getLanguageName(value)}`, severity: 'info' });

  // Added translateTextWithGemini dependency
  }, [isRecognizing, stopRecognition, resetTranscript, originalTranscript, inputLanguage, translateTextWithGemini]);


  // --- Notification Close / Error Clear (no changes) ---
  const handleCloseNotification = useCallback((event, reason) => { if (reason === 'clickaway') return; setNotification(prev => ({ ...prev, open: false })); }, []);
  const clearError = useCallback(() => setError(null), []);

  // --- Cleanup on Unmount (no changes) ---
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current && isRecognizing) speechRecognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, [isRecognizing]);


  // --- JSX Rendering (Minor label changes possible if desired) ---
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Header */}
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} title="Medical Speech Translator (Gemini AI)" />

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Error Alert */}
          {error && ( <Alert severity="error" onClose={clearError} sx={{ mb: 3, width: '100%' }}> {error.message || 'An unknown error occurred.'} </Alert> )}

          {/* Main Panel */}
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
             {/* Title/Desc */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom> Medical Speech Translation </Typography>
                  <Typography variant="body1" color="text.secondary"> Real-time transcription with AI-powered enhancement & translation via Gemini (Performance may vary due to free api usage). </Typography>
              </Box>

              {/* Controls & Lang Selectors */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                 <Grid item xs={12} md={6}>
                    <LanguageSelector
                      inputLanguage={inputLanguage} outputLanguage={outputLanguage}
                      setInputLanguage={(value) => handleLanguageChange('input', value)}
                      setOutputLanguage={(value) => handleLanguageChange('output', value)}
                      disabled={isRecognizing || isLoading || isEnhancing || isTranslating} // Disable during any processing
                    />
                 </Grid>
                 <Grid item xs={12} md={6} >
                    <Controls
                      isRecognizing={isRecognizing} isPaused={isPaused}
                      statusMessage={statusMessage} // Shows "Enhancing...", "Translating...", etc.
                      startRecognition={startRecognition} stopRecognition={stopRecognition}
                      pauseRecognition={pauseRecognition} speakTranslatedText={speakTranslatedText}
                      resetTranscript={resetTranscript} audioLevel={audioLevel}
                      disableStart={isRecognizing || isLoading}
                      disablePause={!isRecognizing || isPaused || isLoading || isEnhancing || isTranslating} // Disable pause during AI calls too
                      disableStop={!isRecognizing || isLoading}
                      disableSpeak={!translatedTranscript || isTranslating || isEnhancing || !window.speechSynthesis} // Disable during any AI call
                      disableReset={isLoading || isRecognizing || isEnhancing || isTranslating || (!originalTranscript && !translatedTranscript)} // Disable during any processing
                    />
                 </Grid>
              </Grid>

              {/* Transcript Panel */}
              <TranscriptPanel
                originalTranscript={originalTranscript} translatedTranscript={translatedTranscript}
                interimText={interimTranscript} isListening={isRecognizing && !isPaused}
                // Show loading if either Gemini task is running
                isProcessing={isEnhancing || isTranslating}
                // Label reflects the current specific task
                processingLabel={isEnhancing ? 'Enhancing...' : (isTranslating ? 'Translating...' : '')}
                outputLanguage={outputLanguage}
                resetTranscript={resetTranscript}
              />
          </Paper>
        </Container>

        {/* Footer */}
        <Box component="footer" sx={{ py: 2, px: 2, mt: 'auto', textAlign: 'center', bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary"> Medical Speech Translator © {new Date().getFullYear()} </Typography>
        </Box>
      </Box>

      {/* Notifications */}
      <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} elevation={6} variant="filled"> {notification.message} </Alert>
      </Snackbar>

      {/* Loading overlay */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
        <CircularProgress color="inherit" /> <Typography sx={{ ml: 2 }}>Initializing...</Typography>
      </Backdrop>
    </ThemeProvider>
  );
};

export default App;

// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   ThemeProvider, 
//   CssBaseline, 
//   Container, 
//   Grid, 
//   Box, 
//   Paper,
//   Typography,
//   Alert,
//   Snackbar,
//   useMediaQuery,
//   Backdrop,
//   CircularProgress
// } from '@mui/material';
// import Header from './components/Header'; // Assuming these components exist
// import LanguageSelector from './components/LanguageSelector'; // Assuming these components exist
// import TranscriptPanel from './components/TranscriptPanel'; // Assuming these components exist
// import Controls from './components/Controls'; // Assuming these components exist
// import { darkTheme, lightTheme } from './themes/theme'; // Assuming these exist

// // --- Constants ---
// // We are REMOVING Google API Keys and Gemini Endpoint
// // Using MyMemory for Free Translation
// const MYMEMORY_TRANSLATE_ENDPOINT = "https://api.mymemory.translated.net/get";

// const App = () => {
//   // --- State Variables ---
//   const [darkMode, setDarkMode] = useState(() => {
//     const savedMode = localStorage.getItem('darkMode');
//     return savedMode ? JSON.parse(savedMode) : false;
//   });
//   const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
//   const [inputLanguage, setInputLanguage] = useState('en-US'); 
//   const [outputLanguage, setOutputLanguage] = useState('es-ES'); 
//   const [originalTranscript, setOriginalTranscript] = useState('');
//   const [interimTranscript, setInterimTranscript] = useState('');
//   const [translatedTranscript, setTranslatedTranscript] = useState('');
//   const [isRecognizing, setIsRecognizing] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const [statusMessage, setStatusMessage] = useState('Idle'); // Default message
//   const [audioLevel, setAudioLevel] = useState(0);
//   const [isTranslating, setIsTranslating] = useState(false); // Keep this for translation loading
//   const [error, setError] = useState(null);
//   const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
//   const [isLoading, setIsLoading] = useState(false); // General loading for start/stop
//   // REMOVED: const [isEnhancing, setIsEnhancing] = useState(false); 

//   // --- Speech Recognition Service (Using Web Speech API - No Changes Needed Here) ---
//   class SpeechRecognitionService {
//       constructor() {
//         this.recognition = null;
//         this.isRunning = false;
//         // Defer initialization until needed or use effect
//       }
      
//       initRecognition() {
//         // Check if already initialized
//         if (this.recognition) return true;

//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//         if (!SpeechRecognition) {
//           setError({ message: "Speech recognition not supported in this browser." });
//           console.error("Speech recognition not supported");
//           return false; 
//         }
        
//         try {
//           this.recognition = new SpeechRecognition();
//           this.recognition.continuous = true; 
//           this.recognition.interimResults = true; 
//           return true;
//         } catch (e) {
//            setError({ message: `Failed to initialize SpeechRecognition: ${e.message}` });
//            console.error("Failed to initialize SpeechRecognition:", e);
//            return false;
//         }
//       }
      
//       start({ language, onResult, onError, onEnd }) { 
//          if (!this.initRecognition()) { // Ensure initialized
//              onError({ message: "Speech recognition could not be initialized." });
//              return;
//          }
        
//         this.recognition.lang = language;
//         this.isRunning = true;
        
//         this.recognition.onresult = (event) => {
//           let finalTranscriptSegment = '';
//           let currentInterimTranscript = '';
//           let calculatedAudioLevel = 0; 

//           if (event.results && event.results.length > 0) {
//               const lastResult = event.results[event.results.length - 1];
//               if (lastResult && lastResult[0] && typeof lastResult[0].confidence === 'number') {
//                    calculatedAudioLevel = Math.min(100, Math.max(0, Math.round(lastResult[0].confidence * 120))); 
//               }
//           }

//           for (let i = event.resultIndex; i < event.results.length; ++i) {
//             if (event.results[i].isFinal) {
//               finalTranscriptSegment += event.results[i][0].transcript + ' ';
//             } else {
//               currentInterimTranscript += event.results[i][0].transcript;
//             }
//           }

//           onResult({
//             finalSegment: finalTranscriptSegment.trim(), 
//             interim: currentInterimTranscript,
//             audioLevel: calculatedAudioLevel,
//           });
//         };
        
//         this.recognition.onerror = (event) => {
//           let errorMessage = event.error || "Unknown speech recognition error";
//           // ... (keep existing error handling for different error types) ...
//           if (event.error === 'network') errorMessage = "Network error during speech recognition.";
//           else if (event.error === 'no-speech') errorMessage = "No speech detected.";
//           else if (event.error === 'audio-capture') errorMessage = "Microphone audio capture error.";
//           else if (event.error === 'not-allowed') errorMessage = "Microphone permission denied.";
//           else if (event.error === 'aborted') errorMessage = "Speech recognition aborted."; 
          
//           onError({ message: errorMessage });
//           this.isRunning = false; 
//         };
        
//         this.recognition.onend = () => {
//             this.isRunning = false; 
//             if (onEnd) {
//                 onEnd(); 
//             }
//         };
        
//         try {
//           this.recognition.start();
//         } catch (e) {
//           // Catch errors like "already started"
//           onError({ message: `Failed to start speech recognition: ${e.message}.` });
//           this.isRunning = false;
//         }
//       }
      
//       stop() {
//         if (this.recognition && this.isRunning) {
//           this.isRunning = false; 
//           this.recognition.stop();
//         }
//       }
      
//       pause() { 
//         if (this.recognition && this.isRunning) {
//           this.isRunning = false; 
//           this.recognition.stop();
//         }
//       }
//     }

//   // --- NEW: Translation Service using MyMemory ---
//   class TranslationService {
//     async translate(text, { from, to }) {
//       if (!text) return { translatedText: '' };

//       // MyMemory uses language codes like 'en', 'es' (not 'en-US')
//       const sourceLang = from.split('-')[0];
//       const targetLang = to.split('-')[0];

//       if (sourceLang === targetLang) {
//           return { translatedText: text }; // No translation needed
//       }

//       const langPair = `${sourceLang}|${targetLang}`;
//       const url = `${MYMEMORY_TRANSLATE_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${langPair}`;

//       try {
//         // Optional: Add your email for potentially higher (but still limited) free usage
//         // const email = "your-email@example.com"; // Replace if you want
//         // url += `&de=${email}`; 

//         const response = await fetch(url);
//         const data = await response.json();

//         if (!response.ok || data.responseStatus !== 200) {
//             const errorMsg = data.responseDetails || `MyMemory API error: ${data.responseStatus || response.status}`;
//             console.error("MyMemory Translation error:", errorMsg, data);
//             // Check for specific rate limit message if API provides it
//             if (errorMsg && /RATE LIMIT/i.test(errorMsg)) {
//                 throw new Error("Translation rate limit reached. Please try again later.");
//             }
//             throw new Error(errorMsg || "Translation failed");
//         }

//         if (data.responseData && data.responseData.translatedText) {
//           // Basic check for MyMemory adding notices
//           if (data.responseData.translatedText.includes("MYMEMORY WARNING")) {
//              console.warn("MyMemory added a warning to the translation.");
//              // Optionally try to clean it, but it's brittle
//           }
//           return { translatedText: data.responseData.translatedText };
//         } else {
//           console.warn("MyMemory returned unexpected format:", data);
//           return { translatedText: `[Translation Format Error]` };
//         }
//       } catch (error) {
//         console.error("Translation Service fetch error:", error);
//         return { translatedText: `[Translation Error: ${error.message}]` };
//       }
//     }
//   }
  
//   // --- Initialize services using useRef ---
//   const speechRecognitionRef = React.useRef(null);
//   const translatorRef = React.useRef(null);

//   useEffect(() => {
//       if (!speechRecognitionRef.current) {
//           speechRecognitionRef.current = new SpeechRecognitionService();
//       }
//       if (!translatorRef.current) {
//           translatorRef.current = new TranslationService();
//       }
//   }, []); 

//   // --- Theme Effects (No changes) ---
//   useEffect(() => {
//     if (localStorage.getItem('darkMode') === null) {
//       setDarkMode(prefersDarkMode);
//     }
//   }, [prefersDarkMode]);
  
//   useEffect(() => {
//     localStorage.setItem('darkMode', JSON.stringify(darkMode));
//   }, [darkMode]);

//   const toggleDarkMode = useCallback(() => {
//     setDarkMode(prevMode => !prevMode);
//   }, []);

//   // --- Transcript Reset (No changes) ---
//   const resetTranscript = useCallback(() => {
//     setOriginalTranscript('');
//     setTranslatedTranscript('');
//     setInterimTranscript('');
//     setNotification({ open: true, message: 'Transcripts cleared', severity: 'info' });
//   }, []);

//   // --- REMOVED: enhanceMedicalTerms function ---
//   // const enhanceMedicalTerms = useCallback(async (text) => { ... });

//   // --- Translate Text (Calls the new TranslationService) ---
//   const translateText = useCallback(async (textToTranslate) => {
//     if (!textToTranslate || !translatorRef.current) {
//         setTranslatedTranscript(''); 
//         return;
//     }

//     const sourceBaseLang = inputLanguage.split('-')[0];
//     const targetBaseLang = outputLanguage.split('-')[0];
//     if (sourceBaseLang === targetBaseLang) {
//         setTranslatedTranscript(textToTranslate); 
//         return;
//     }

//     setIsTranslating(true);
//     setStatusMessage('Translating...'); 
    
//     try {
//       // Use the new translator service instance
//       const result = await translatorRef.current.translate(textToTranslate, {
//         from: inputLanguage,
//         to: outputLanguage
//       });
//       setTranslatedTranscript(result.translatedText); // Update state with result
      
//     } catch (error) { // Catch errors if service throws them (though our service tries to return error message)
//       console.error("Translation error in component:", error);
//       setError({ message: error.message || "An unknown translation error occurred." }); 
//       setNotification({
//         open: true,
//         message: `Translation error: ${error.message}`,
//         severity: 'error'
//       });
//       setTranslatedTranscript('[Translation Failed]'); 
//     } finally {
//       setIsTranslating(false);
//       // Restore status based on recognition state
//       setStatusMessage(isRecognizing ? (isPaused ? 'Paused' : 'Listening...') : 'Idle');
//     }
//   }, [inputLanguage, outputLanguage, isRecognizing, isPaused]); 

//   // --- MODIFIED: Start Speech Recognition (No Enhancement Call) ---
//   const startRecognition = useCallback(async () => {
//     if (!speechRecognitionRef.current) {
//         setError({ message: "Speech Recognition service not available." });
//         return;
//     }
//     if (isRecognizing) return; 

//     clearError(); 
//     setIsLoading(true); 
//     setStatusMessage('Initializing...');
    
//     try {
//         await navigator.mediaDevices.getUserMedia({ audio: true });
//     } catch (permissionError) {
//         setError({ message: "Microphone access denied. Please allow permission." });
//         setStatusMessage('Permission denied');
//         setIsLoading(false);
//         return;
//     }

//     setIsRecognizing(true);
//     setIsPaused(false);
//     setStatusMessage('Listening...');
    
//     speechRecognitionRef.current.start({
//       language: inputLanguage,
//       onResult: async ({ finalSegment, interim, audioLevel }) => {
//         setInterimTranscript(interim);
//         if (audioLevel !== undefined) setAudioLevel(audioLevel);
        
//         if (finalSegment) {
//           // --- REMOVED ENHANCEMENT STEP ---
//           // const enhancedSegment = await enhanceMedicalTerms(finalSegment); // REMOVED

//           // Directly append the raw final segment
//           const updatedOriginalTranscript = originalTranscript + finalSegment + ' ';
//           setOriginalTranscript(updatedOriginalTranscript);
          
//           setInterimTranscript(''); 
          
//           // --- Translate the updated raw transcript ---
//           await translateText(updatedOriginalTranscript); 
//         }
//       },
//       onError: (err) => {
//         setError(err);
//         setStatusMessage(`Error: ${err.message}`);
//         setIsRecognizing(false);
//         setIsPaused(false);
//         setAudioLevel(0);
//         setIsLoading(false); 
//       },
//       onEnd: () => {
//          // ... (keep existing onEnd logic) ...
//          setStatusMessage(isPaused ? 'Paused' : 'Recognition stopped');
//          setIsRecognizing(false); 
//          setAudioLevel(0);
//          setIsLoading(false); 
//       }
//     });
    
//     setTimeout(() => setIsLoading(false), 300); 

//   // REMOVED enhanceMedicalTerms from dependencies
//   }, [inputLanguage, originalTranscript, translateText, isRecognizing, isPaused]); 

//   // --- Stop Speech Recognition (No changes) ---
//   const stopRecognition = useCallback(() => {
//     if (speechRecognitionRef.current) {
//         speechRecognitionRef.current.stop(); 
//     }
//     setIsPaused(false); 
//     if (interimTranscript) {
//        // Optional: append final interim bit? Or just clear.
//        // setOriginalTranscript(prev => prev + interimTranscript + ' '); // Example if you want to keep it
//        // translateText(originalTranscript + interimTranscript + ' ');
//        setInterimTranscript('');
//     }
//   }, [interimTranscript, originalTranscript, translateText]); // Added dependencies if processing interim


//   // --- Pause Speech Recognition (No changes) ---
//   const pauseRecognition = useCallback(() => {
//     if (isRecognizing && !isPaused) {
//       setIsPaused(true);
//       setStatusMessage('Pausing...');
//        if (speechRecognitionRef.current) {
//            speechRecognitionRef.current.pause(); 
//        }
//     }
//   }, [isRecognizing, isPaused]); 


//   // --- Speak Translated Text (Using Web Speech API - No Changes) ---
//   const speakTranslatedText = useCallback(() => {
//     if (!translatedTranscript || isTranslating) { 
//       setNotification({
//         open: true,
//         message: 'No translated text available or still translating.',
//         severity: 'warning'
//       });
//       return;
//     }
    
//     window.speechSynthesis.cancel(); 

//     setStatusMessage('Speaking...');
//     const utterance = new SpeechSynthesisUtterance(translatedTranscript);
//     // Ensure outputLanguage is set correctly for the voice if possible
//     const targetLang = outputLanguage.split('-')[0]; // Use base language 'es' from 'es-ES'
//     utterance.lang = targetLang; 

//      // Attempt to find a voice matching the language for better quality
//      const voices = window.speechSynthesis.getVoices();
//      const voice = voices.find(v => v.lang.startsWith(targetLang));
//      if (voice) {
//          utterance.voice = voice;
//          console.log(`Using voice: ${voice.name} for language ${targetLang}`);
//      } else {
//           console.warn(`No specific voice found for language ${targetLang}. Using default.`);
//      }
    
//     utterance.onend = () => {
//        setStatusMessage(isRecognizing ? (isPaused ? 'Paused' : 'Listening...') : 'Idle');
//     };
    
//     utterance.onerror = (event) => {
//       console.error("Speech synthesis error:", event.error);
//       setError({ message: `Speech error: ${event.error}` });
//       setStatusMessage(`Speech error`); 
//     };
    
//     // Ensure voices are loaded (needed in some browsers, especially on first load)
//     if (window.speechSynthesis.getVoices().length === 0) {
//         window.speechSynthesis.onvoiceschanged = () => {
//              window.speechSynthesis.speak(utterance);
//         };
//     } else {
//         window.speechSynthesis.speak(utterance);
//     }

//   }, [translatedTranscript, outputLanguage, isRecognizing, isPaused, isTranslating]); 


//   // --- Handle Language Change (No changes needed in logic) ---
//   const handleLanguageChange = useCallback((type, value) => {
//     if (isRecognizing) {
//       stopRecognition(); 
//     }
    
//     if (type === 'input') {
//       setInputLanguage(value);
//       resetTranscript(); 
//     } else {
//       setOutputLanguage(value);
//       setTranslatedTranscript(''); 
//       // Re-translate if original exists when output changes
//       if (originalTranscript) {
//         translateText(originalTranscript); 
//       }
//     }
    
//     setNotification({
//       open: true,
//       message: `${type === 'input' ? 'Input' : 'Output'} language set to ${value}`,
//       severity: 'info'
//     });
//   }, [isRecognizing, stopRecognition, resetTranscript, originalTranscript, translateText]); 


//   // --- Notification Close (No changes) ---
//   const handleCloseNotification = useCallback((event, reason) => {
//     if (reason === 'clickaway') return;
//     setNotification(prev => ({ ...prev, open: false }));
//   }, []);

//   // --- Error Clear (No changes) ---
//   const clearError = useCallback(() => {
//     setError(null);
//   }, []);

//   // --- Cleanup on Unmount (No changes) ---
//   useEffect(() => {
//     return () => {
//       if (speechRecognitionRef.current && isRecognizing) {
//         speechRecognitionRef.current.stop();
//       }
//        window.speechSynthesis.cancel();
//     };
//   }, [isRecognizing]); 


//   // --- JSX Rendering (Update UI text, remove enhancement indicators) ---
//   return (
//     <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
//       <CssBaseline />
//       <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
//         {/* Header - Update title if needed */}
//         <Header 
//           darkMode={darkMode} 
//           toggleDarkMode={toggleDarkMode} 
//           title="Medical Speech Translator" // Removed "Gemini Enhanced"
//         />

//         {/* Main Content */}
//         <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
//           {/* Error Alert */}
//           {error && (
//             <Alert severity="error" onClose={clearError} sx={{ mb: 3, width: '100%' }}>
//               {error.message || 'An unknown error occurred.'}
//             </Alert>
//           )}
          
//           {/* Main Application Panel */}
//           <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
//              {/* Title and Description - Update description */}
//               <Box sx={{ mb: 4, textAlign: 'center' }}>
//                   <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
//                       Medical Speech Translation
//                   </Typography>
//                   <Typography variant="body1" color="text.secondary">
//                       Real-time transcription & translation using browser features.
//                   </Typography>
//                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
//                        (Note: Translation provided by MyMemory API - quality may vary, rate limits apply.)
//                    </Typography>
//               </Box>
              
//               {/* Controls and Language Selectors */}
//               <Grid container spacing={3} sx={{ mb: 3 }}>
//                  <Grid item xs={12} md={6}>
//                     <LanguageSelector
//                       inputLanguage={inputLanguage}
//                       outputLanguage={outputLanguage}
//                       setInputLanguage={(value) => handleLanguageChange('input', value)}
//                       setOutputLanguage={(value) => handleLanguageChange('output', value)}
//                       disabled={isRecognizing || isLoading} // Also disable during initial loading
//                     />
//                  </Grid>
//                  <Grid item xs={12} md={6}>
//                     <Controls
//                       isRecognizing={isRecognizing}
//                       isPaused={isPaused}
//                       statusMessage={statusMessage} 
//                       startRecognition={startRecognition}
//                       stopRecognition={stopRecognition}
//                       pauseRecognition={pauseRecognition} 
//                       speakTranslatedText={speakTranslatedText}
//                       resetTranscript={resetTranscript}
//                       audioLevel={audioLevel} 
//                       // Update disable logic (removed isEnhancing)
//                       disableStart={isRecognizing || isLoading} 
//                       disablePause={!isRecognizing || isPaused || isLoading}
//                       disableStop={!isRecognizing || isLoading}
//                       // Disable speak if no transcript OR if translating OR if synthesis isn't ready
//                       disableSpeak={!translatedTranscript || isTranslating || !window.speechSynthesis} 
//                       disableReset={isLoading || isRecognizing || (!originalTranscript && !translatedTranscript)}
//                     />
//                  </Grid>
//               </Grid>

//               {/* Transcript Panels - Update props */}
//               <TranscriptPanel
//                 originalTranscript={originalTranscript}
//                 translatedTranscript={translatedTranscript}
//                 interimText={interimTranscript}
//                 isListening={isRecognizing && !isPaused}
//                 // Only show processing indicator for translation now
//                 isProcessing={isTranslating} 
//                 processingLabel={isTranslating ? 'Translating...' : ''} // Simpler label
//               />
//           </Paper>
//         </Container>
        
//         {/* Footer */}
//         <Box component="footer" sx={{ py: 2, px: 2, mt: 'auto', textAlign: 'center', bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider' }}>
//           <Typography variant="body2" color="text.secondary">
//             Medical Speech Translator © {new Date().getFullYear()}
//           </Typography>
//         </Box>
//       </Box>
      
//       {/* Notifications */}
//       <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//         <Alert onClose={handleCloseNotification} severity={notification.severity} elevation={6} variant="filled">
//           {notification.message}
//         </Alert>
//       </Snackbar>
      
//       {/* Loading overlay */}
//       <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
//         <CircularProgress color="inherit" />
//         <Typography sx={{ ml: 2 }}>Initializing...</Typography> 
//       </Backdrop>
//     </ThemeProvider>
//   );
// };

// export default App;