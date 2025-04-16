import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  MenuItem, 
  Select, 
  Box,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LanguageIcon from '@mui/icons-material/Language';

// Language options array for reusability
const languageOptions = [
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
  { value: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { value: 'de-DE', label: 'German', flag: '🇩🇪' },
  { value: 'it-IT', label: 'Italian', flag: '🇮🇹' },
  { value: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
  { value: 'ru-RU', label: 'Russian', flag: '🇷🇺' },
  { value: 'zh-CN', label: 'Chinese', flag: '🇨🇳' },
  { value: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
  { value: 'ar-SA', label: 'Arabic', flag: '🇸🇦' },
  { value: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
];

const LanguageSelector = ({ inputLanguage, outputLanguage, setInputLanguage, setOutputLanguage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSwapLanguages = () => {
    const tempLang = inputLanguage;
    setInputLanguage(outputLanguage);
    setOutputLanguage(tempLang);
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
      <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LanguageIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            Language Settings
          </Typography>
        </Box>
      </Box>

      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="input-language-label">Input Language</InputLabel>
              <Select
                labelId="input-language-label"
                id="input-language"
                value={inputLanguage}
                onChange={(e) => setInputLanguage(e.target.value)}
                label="Input Language"
                sx={{ 
                  '& .MuiSelect-select': { 
                    display: 'flex', 
                    alignItems: 'center' 
                  }
                }}
              >
                {languageOptions.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>{lang.flag}</Typography>
                      {lang.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton 
              onClick={handleSwapLanguages}
              sx={{
                bgcolor: theme.palette.action.hover,
                '&:hover': {
                  bgcolor: theme.palette.primary.light,
                  color: 'white'
                },
                transition: 'all 0.3s ease'
              }}
              aria-label="Swap languages"
              title="Swap languages"
            >
              <SwapHorizIcon />
            </IconButton>
            {isMobile ? null : (
              <Box sx={{ mx: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Divider orientation="vertical" flexItem />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={5}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="output-language-label">Output Language</InputLabel>
              <Select
                labelId="output-language-label"
                id="output-language"
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value)}
                label="Output Language"
                sx={{ 
                  '& .MuiSelect-select': { 
                    display: 'flex', 
                    alignItems: 'center' 
                  }
                }}
              >
                {languageOptions.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>{lang.flag}</Typography>
                      {lang.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Paper>
  );
};

export default LanguageSelector;