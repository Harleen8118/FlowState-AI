import { useState, useRef } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Tooltip,
  Fade,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import DownloadIcon from "@mui/icons-material/Download";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

import theme from "./theme";
import ScoreCard from "./components/ScoreCard";
import AdInsightsPanel from "./components/AdInsightsPanel";
import { analyzeAd, personalizePage } from "./utils/gemini";
import {
  fetchViaProxy,
  cleanHtmlForAI,
  detectSPA,
  injectBaseTag,
  fileToBase64,
  urlToBase64,
} from "./utils/htmlUtils";
import { calcMessageMatchScore } from "./utils/scoring";

const STEPS = [
  "Reading image",
  "Analyzing ad",
  "Fetching page",
  "Scoring",
  "Rewriting",
  "Final score",
];

// Shared label style used throughout
const labelStyle = {
  fontSize: "0.8rem",
  fontWeight: 500,
  color: "#8A8A9A",
  mb: 0.8,
  display: "block",
};

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [adFile, setAdFile] = useState(null);
  const [adUrl, setAdUrl] = useState("");
  const [adMode, setAdMode] = useState("upload");

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [error, setError] = useState("");
  const [spaWarning, setSpaWarning] = useState(false);

  // API key modal state
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const [adInsights, setAdInsights] = useState(null);
  const [beforeScore, setBeforeScore] = useState(null);
  const [afterScore, setAfterScore] = useState(null);
  const [personalizedHtml, setPersonalizedHtml] = useState("");

  const fileRef = useRef(null);

  // Called when user clicks "Run" - open API key modal if key not set
  function handleRunClick() {
    setError("");
    if (!landingUrl.trim()) {
      setError("You need to paste a landing page URL first.");
      return;
    }
    if (adMode === "upload" && !adFile) {
      setError("Pick an ad image before running.");
      return;
    }
    if (adMode === "url" && !adUrl.trim()) {
      setError("Paste the URL of your ad image.");
      return;
    }
    if (!apiKey) {
      // Open the API key dialog
      setApiKeyDraft("");
      setKeyModalOpen(true);
      return;
    }
    runGeneration(apiKey);
  }

  function handleKeySubmit() {
    if (!apiKeyDraft.trim()) return;
    setApiKey(apiKeyDraft.trim());
    setKeyModalOpen(false);
    runGeneration(apiKeyDraft.trim());
  }

  async function runGeneration(key) {
    setError("");
    setSpaWarning(false);
    setLoading(true);
    setCurrentStep(0);
    setAdInsights(null);
    setBeforeScore(null);
    setAfterScore(null);
    setPersonalizedHtml("");

    try {
      setStepLabel("Reading your ad image...");
      setCurrentStep(0);
      let imageBase64, imageMimeType;
      if (adMode === "upload") {
        imageMimeType = adFile.type || "image/jpeg";
        imageBase64 = await fileToBase64(adFile);
      } else {
        setStepLabel("Pulling the image from that URL...");
        const result = await urlToBase64(adUrl);
        imageBase64 = result.base64;
        imageMimeType = result.mimeType;
      }

      setStepLabel("Looking at what the ad is saying...");
      setCurrentStep(1);
      const insights = await analyzeAd(key, imageBase64, imageMimeType);
      setAdInsights(insights);

      setStepLabel("Grabbing the landing page...");
      setCurrentStep(2);
      const rawHtml = await fetchViaProxy(landingUrl);

      if (detectSPA(rawHtml)) setSpaWarning(true);

      const cleanedHtml = cleanHtmlForAI(rawHtml);

      setStepLabel("Scoring how well the page matches the ad right now...");
      setCurrentStep(3);
      const pageText = rawHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const before = calcMessageMatchScore(insights, pageText);
      setBeforeScore(before);

      setStepLabel("Rewriting the page to match your ad (30-60s)...");
      setCurrentStep(4);
      let newHtml = await personalizePage(key, cleanedHtml, insights, landingUrl);
      newHtml = injectBaseTag(newHtml, landingUrl);
      setPersonalizedHtml(newHtml);

      setStepLabel("Running the final check...");
      setCurrentStep(5);
      const newText = newHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const after = calcMessageMatchScore(insights, newText);
      setAfterScore(after);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStepLabel("");
    }
  }

  function handleDownload() {
    const blob = new Blob([personalizedHtml], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "updated-landing-page.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const improvement =
    beforeScore && afterScore ? afterScore.total - beforeScore.total : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ─── API KEY DIALOG ───────────────────────────────────────── */}
      <Dialog
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1A1A1D",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                backgroundColor: "rgba(232,100,58,0.12)",
                border: "1px solid rgba(232,100,58,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <VpnKeyOutlinedIcon sx={{ fontSize: 16, color: "#E8643A" }} />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#F0F0F2" }}>
              Add your API key
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setKeyModalOpen(false)}
            sx={{ color: "#555560", "&:hover": { color: "#8A8A9A" } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0, pb: 2 }}>
          <Typography
            variant="body2"
            sx={{ color: "#8A8A9A", fontSize: "0.82rem", mb: 2, lineHeight: 1.6 }}
          >
            You need a Gemini API key to run this. Get one free at{" "}
            <Box
              component="a"
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener"
              sx={{ color: "#E8643A", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              aistudio.google.com
            </Box>
            . It stays in your browser only.
          </Typography>
          <TextField
            fullWidth
            type="password"
            value={apiKeyDraft}
            onChange={(e) => setApiKeyDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
            placeholder="AIzaSy..."
            size="small"
            autoFocus
            id="api-key-modal-input"
          />
          <Typography
            variant="caption"
            sx={{ color: "#555560", fontSize: "0.69rem", mt: 1, display: "block" }}
          >
            Use a throwaway key for demos. Your key shows up in network requests.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            variant="text"
            onClick={() => setKeyModalOpen(false)}
            sx={{ color: "#8A8A9A", fontSize: "0.85rem" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleKeySubmit}
            disabled={!apiKeyDraft.trim()}
            startIcon={<PlayArrowRounded sx={{ fontSize: 17 }} />}
            sx={{ fontSize: "0.85rem", px: 2.5 }}
          >
            Save and run
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ minHeight: "100vh", backgroundColor: "#0F0F11" }}>

        {/* ─── NAV ─────────────────────────────────────────────────── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "rgba(15,15,17,0.85)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Toolbar
            sx={{
              maxWidth: 820,
              width: "100%",
              mx: "auto",
              px: { xs: 2, md: 3 },
              minHeight: "54px !important",
            }}
          >
            {/* Logo mark */}
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                backgroundColor: "#E8643A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1.5,
                flexShrink: 0,
              }}
            >
              <AutoAwesomeRounded sx={{ fontSize: 16, color: "#fff" }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#F0F0F2",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                FlowState
                <Box component="span" sx={{ color: "#E8643A" }}>
                  .ai
                </Box>
              </Typography>
            </Box>

            {/* Show key status */}
            {apiKey ? (
              <Chip
                icon={<CheckCircleOutlinedIcon sx={{ fontSize: "15px !important", color: "#22C55E !important" }} />}
                label="API key saved"
                size="small"
                onClick={() => { setApiKeyDraft(""); setKeyModalOpen(true); }}
                sx={{
                  backgroundColor: "rgba(34,197,94,0.08)",
                  color: "#22C55E",
                  border: "1px solid rgba(34,197,94,0.15)",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              />
            ) : (
              <Button
                size="small"
                variant="text"
                startIcon={<VpnKeyOutlinedIcon sx={{ fontSize: 15 }} />}
                onClick={() => { setApiKeyDraft(""); setKeyModalOpen(true); }}
                sx={{
                  color: "#8A8A9A",
                  fontSize: "0.78rem",
                  "&:hover": { color: "#E8643A", backgroundColor: "rgba(232,100,58,0.06)" },
                }}
              >
                Add API key
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* ─── HERO ────────────────────────────────────────────────── */}
        <Box
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            py: { xs: 4, md: 5 },
            textAlign: "center",
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.7rem", md: "2rem" },
                fontWeight: 700,
                color: "#F0F0F2",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                mb: 1.2,
              }}
            >
              Your ads and landing pages{" "}
              <Box component="span" sx={{ color: "#E8643A" }}>
                should say the same thing.
              </Box>
            </Typography>
            <Typography
              sx={{
                color: "#8A8A9A",
                fontSize: "0.92rem",
                lineHeight: 1.7,
                maxWidth: 440,
                mx: "auto",
              }}
            >
              Drop in an ad, paste a URL, and we'll rewrite your landing page
              copy to match what the ad promises. Then score it.
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="sm" sx={{ py: { xs: 3, md: 4 } }}>

          {/* ─── MAIN FORM ───────────────────────────────────────────── */}
          <Fade in timeout={400}>
            <Paper elevation={0} sx={{ p: 3, mb: 2.5, borderRadius: 2 }}>

              {/* Ad creative */}
              <Typography sx={labelStyle}>Ad creative</Typography>
              <ToggleButtonGroup
                value={adMode}
                exclusive
                onChange={(_, v) => v && setAdMode(v)}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="upload" id="toggle-upload">
                  <CloudUploadIcon sx={{ fontSize: 15, mr: 0.7 }} />
                  Upload file
                </ToggleButton>
                <ToggleButton value="url" id="toggle-url">
                  <LinkIcon sx={{ fontSize: 15, mr: 0.7 }} />
                  Image URL
                </ToggleButton>
              </ToggleButtonGroup>

              {adMode === "upload" ? (
                <Box
                  onClick={() => fileRef.current?.click()}
                  id="upload-dropzone"
                  sx={{
                    border: "1px dashed",
                    borderColor: adFile ? "#E8643A" : "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    p: 3.5,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor: adFile
                      ? "rgba(232,100,58,0.05)"
                      : "rgba(255,255,255,0.01)",
                    "&:hover": {
                      borderColor: "#E8643A",
                      backgroundColor: "rgba(232,100,58,0.04)",
                    },
                    mb: 2.5,
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => setAdFile(e.target.files[0])}
                    id="file-input"
                  />
                  {adFile ? (
                    <>
                      <ImageOutlinedIcon
                        sx={{ fontSize: 26, color: "#E8643A", mb: 0.5 }}
                      />
                      <Typography
                        sx={{ color: "#E8643A", fontWeight: 600, fontSize: "0.85rem" }}
                      >
                        {adFile.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#555560" }}>
                        Click to change
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CloudUploadIcon
                        sx={{ fontSize: 28, color: "#3C3C43", mb: 0.5 }}
                      />
                      <Typography sx={{ color: "#8A8A9A", fontSize: "0.85rem" }}>
                        Click to pick your ad image
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#555560" }}>
                        PNG, JPG, or WEBP
                      </Typography>
                    </>
                  )}
                </Box>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  value={adUrl}
                  onChange={(e) => setAdUrl(e.target.value)}
                  placeholder="https://example.com/my-ad.jpg"
                  id="ad-url-input"
                  sx={{ mb: 2.5 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <ImageOutlinedIcon
                          sx={{ fontSize: 17, color: "#555560", mr: 1 }}
                        />
                      ),
                    },
                  }}
                />
              )}

              {/* Landing page URL */}
              <Typography sx={labelStyle}>Landing page URL</Typography>
              <TextField
                fullWidth
                size="small"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="https://yoursite.com/landing"
                id="landing-url-input"
                sx={{ mb: 0.6 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <LanguageOutlinedIcon
                        sx={{ fontSize: 17, color: "#555560", mr: 1 }}
                      />
                    ),
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: "#555560", fontSize: "0.71rem", mb: 2.5, display: "block" }}
              >
                Works best with Webflow, WordPress, and plain HTML sites. SPAs
                won't have much HTML to work with.
              </Typography>

              {/* Run button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleRunClick}
                disabled={loading}
                id="generate-button"
                startIcon={
                  loading ? (
                    <CircularProgress size={17} sx={{ color: "#fff" }} />
                  ) : (
                    <PlayArrowRounded />
                  )
                }
                sx={{
                  py: 1.4,
                  fontSize: "0.93rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  mt: 0.5,
                }}
              >
                {loading ? "Working on it..." : "Run Personalization"}
              </Button>

              {/* Progress */}
              {loading && (
                <Grow in>
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.8,
                      borderRadius: 1.5,
                      backgroundColor: "rgba(232,100,58,0.05)",
                      border: "1px solid rgba(232,100,58,0.12)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.4,
                        mb: 1.2,
                      }}
                    >
                      <CircularProgress
                        size={14}
                        thickness={5}
                        sx={{ color: "#E8643A" }}
                      />
                      <Typography
                        sx={{
                          color: "#E8643A",
                          fontWeight: 500,
                          fontSize: "0.82rem",
                        }}
                      >
                        {stepLabel}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {STEPS.map((s, i) => (
                        <Tooltip title={s} key={i} arrow placement="top">
                          <Box
                            sx={{
                              flex: 1,
                              height: 3,
                              borderRadius: 2,
                              backgroundColor:
                                i <= currentStep
                                  ? "#E8643A"
                                  : "rgba(255,255,255,0.06)",
                              transition: "background-color 0.4s ease",
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                </Grow>
              )}

              {/* SPA warning */}
              {spaWarning && (
                <Alert
                  severity="warning"
                  icon={<WarningAmberIcon />}
                  sx={{
                    mt: 2,
                    backgroundColor: "rgba(251,191,36,0.06)",
                    border: "1px solid rgba(251,191,36,0.15)",
                    color: "#FBBF24",
                    "& .MuiAlert-icon": { color: "#FBBF24" },
                  }}
                >
                  <AlertTitle sx={{ fontSize: "0.83rem", fontWeight: 600, color: "#FBBF24" }}>
                    Heads up: looks like a JS-rendered page
                  </AlertTitle>
                  <Typography variant="caption" sx={{ lineHeight: 1.5, color: "#D97706" }}>
                    Pages built with React, Next.js, or Vue send almost empty
                    HTML through the proxy, so there isn't much to rewrite. Try
                    a Webflow, WordPress, or static HTML page instead.
                  </Typography>
                </Alert>
              )}

              {/* Error */}
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 2,
                    backgroundColor: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.15)",
                    color: "#F87171",
                    "& .MuiAlert-icon": { color: "#F87171" },
                  }}
                  id="error-alert"
                >
                  {error}
                </Alert>
              )}
            </Paper>
          </Fade>

          {/* ─── MESSAGE MATCH SCORE ─────────────────────────────────── */}
          {beforeScore && afterScore && (
            <Fade in timeout={400}>
              <Paper elevation={0} sx={{ p: 3, mb: 2.5, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 0.5,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 18, color: "#E8643A" }} />
                    <Typography
                      sx={{ fontSize: "0.93rem", fontWeight: 600, color: "#F0F0F2" }}
                    >
                      Message Match Score
                    </Typography>
                  </Box>
                  {improvement !== null && (
                    <Chip
                      label={
                        improvement > 0
                          ? `+${improvement} pts`
                          : improvement === 0
                          ? "No change"
                          : `${improvement} pts`
                      }
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        backgroundColor:
                          improvement > 0
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(255,255,255,0.05)",
                        color: improvement > 0 ? "#22C55E" : "#8A8A9A",
                        border: `1px solid ${
                          improvement > 0
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(255,255,255,0.08)"
                        }`,
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#555560",
                    mb: 2.5,
                    display: "block",
                    fontSize: "0.73rem",
                  }}
                >
                  How closely your landing page lines up with what the ad
                  promises. Higher means a more consistent experience.
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <ScoreCard
                    title="BEFORE"
                    score={beforeScore.total}
                    breakdown={beforeScore.breakdown}
                  />
                  <ScoreCard
                    title="AFTER"
                    score={afterScore.total}
                    breakdown={afterScore.breakdown}
                  />
                </Box>
              </Paper>
            </Fade>
          )}

          {/* ─── AD ANALYSIS ─────────────────────────────────────────── */}
          {adInsights && (
            <Fade in timeout={400}>
              <Box sx={{ mb: 2.5 }}>
                <AdInsightsPanel insights={adInsights} />
              </Box>
            </Fade>
          )}

          {/* ─── PREVIEW ─────────────────────────────────────────────── */}
          {personalizedHtml && (
            <Fade in timeout={400}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PreviewOutlinedIcon sx={{ fontSize: 18, color: "#E8643A" }} />
                    <Typography
                      sx={{ fontSize: "0.93rem", fontWeight: 600, color: "#F0F0F2" }}
                    >
                      Updated Page Preview
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
                    onClick={handleDownload}
                    id="download-button"
                    sx={{
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "#8A8A9A",
                      fontSize: "0.78rem",
                      px: 1.8,
                      "&:hover": {
                        borderColor: "#E8643A",
                        color: "#E8643A",
                        backgroundColor: "rgba(232,100,58,0.06)",
                      },
                    }}
                  >
                    Download HTML
                  </Button>
                </Box>
                <Box
                  sx={{
                    borderRadius: 1.5,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.06)",
                    height: 580,
                    backgroundColor: "#fff",
                  }}
                >
                  {/*
                    Only allow-scripts in sandbox.
                    Adding allow-same-origin would break the sandbox.
                  */}
                  <iframe
                    srcDoc={personalizedHtml}
                    title="Updated Landing Page"
                    sandbox="allow-scripts"
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#555560",
                    mt: 1.5,
                    display: "block",
                    fontSize: "0.69rem",
                  }}
                >
                  Images and CSS load from the original site. Downloads work
                  fully. Some interactive elements are limited in this preview.
                </Typography>
              </Paper>
            </Fade>
          )}
        </Container>

        {/* ─── FOOTER ──────────────────────────────────────────────── */}
        <Box
          component="footer"
          sx={{
            py: 3,
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#3C3C43", fontSize: "0.72rem" }}
          >
            FlowState.ai
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
