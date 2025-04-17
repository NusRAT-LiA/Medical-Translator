
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


const GOOGLE_AI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?";



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

  // --- Speech Recognition Service (Web Speech API ) ---
  class SpeechRecognitionService {
      constructor() {
        this.recognition = null;
        this.isRunning = false;
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



  const speechRecognitionRef = React.useRef(null);

  useEffect(() => {
      if (!speechRecognitionRef.current) {
          speechRecognitionRef.current = new SpeechRecognitionService();
      }
  }, []);


  useEffect(() => {
    if (localStorage.getItem('darkMode') === null) setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  const toggleDarkMode = useCallback(() => setDarkMode(prevMode => !prevMode), []);

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
             // Sometimes the response is 200 OK but has no candidates
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


  // Translate Text using Gemini ---
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


  // --- Start Speech Recognition ---
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


  // --- Pause Speech Recognition  ---
  const pauseRecognition = useCallback(() => {
    if (isRecognizing && !isPaused) {
      setIsPaused(true); setStatusMessage('Pausing...');
       if (speechRecognitionRef.current) { speechRecognitionRef.current.pause(); } // Triggers onEnd
    }
  }, [isRecognizing, isPaused]);


  // --- Speak Translated Text (Web Speech API ) ---
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


  // --- Notification Close / Error Clear---
  const handleCloseNotification = useCallback((event, reason) => { if (reason === 'clickaway') return; setNotification(prev => ({ ...prev, open: false })); }, []);
  const clearError = useCallback(() => setError(null), []);

  // --- Cleanup on Unmount  ---
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current && isRecognizing) speechRecognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, [isRecognizing]);


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