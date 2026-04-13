import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#E8643A",
      light: "#F08A66",
      dark: "#C94E26",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#A78BFA",
      light: "#C4B5FD",
      dark: "#8B5CF6",
    },
    success: {
      main: "#22C55E",
      light: "#DCFCE7",
      dark: "#16A34A",
    },
    warning: {
      main: "#FBBF24",
      light: "#FEF3C7",
      dark: "#D97706",
    },
    error: {
      main: "#F87171",
      light: "#FEE2E2",
      dark: "#DC2626",
    },
    background: {
      default: "#0F0F11",
      paper: "#1A1A1D",
    },
    text: {
      primary: "#F0F0F2",
      secondary: "#8A8A9A",
    },
    divider: "rgba(255,255,255,0.06)",
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          padding: "9px 20px",
          fontSize: "0.9rem",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        containedPrimary: {
          backgroundColor: "#E8643A",
          "&:hover": { backgroundColor: "#C94E26" },
          "&.Mui-disabled": { backgroundColor: "#2C2C31", color: "#555560" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1A1A1D",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          backgroundColor: "#141416",
          color: "#F0F0F2",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.08)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.14)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#E8643A",
            borderWidth: "1.5px",
          },
          "& input::placeholder": { color: "#555560", opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: "#8A8A9A" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontSize: "0.75rem" },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 5,
          backgroundColor: "rgba(255,255,255,0.05)",
        },
        bar: { borderRadius: 4 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px !important",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "#8A8A9A",
          padding: "6px 16px",
          "&.Mui-selected": {
            backgroundColor: "rgba(232,100,58,0.12)",
            color: "#E8643A",
            borderColor: "rgba(232,100,58,0.25)",
            "&:hover": { backgroundColor: "rgba(232,100,58,0.18)" },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1A1A1D",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { color: "#F0F0F2", fontWeight: 600 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "rgba(255,255,255,0.06)" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "none" },
      },
    },
  },
});

export default theme;
