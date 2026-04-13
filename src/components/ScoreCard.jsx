import { Box, Typography, LinearProgress, Paper } from "@mui/material";

function getScoreColor(pct) {
  if (pct >= 70) return "#22C55E";
  if (pct >= 40) return "#FBBF24";
  return "#F87171";
}

function ScoreBreakdownBar({ label, score, max, detail }) {
  const pct = Math.round((score / max) * 100);
  const color = getScoreColor(pct);

  return (
    <Box sx={{ mb: 1.8 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#8A8A9A", fontSize: "0.77rem", fontWeight: 500 }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color, fontWeight: 600, fontSize: "0.77rem" }}
        >
          {score}/{max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 5,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.05)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
            borderRadius: 3,
            transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          color: "#555560",
          fontSize: "0.69rem",
          mt: 0.4,
          display: "block",
        }}
      >
        {detail}
      </Typography>
    </Box>
  );
}

export default function ScoreCard({ title, score, breakdown }) {
  const color = getScoreColor(score);

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 240,
        p: 2.5,
        borderRadius: 2,
        backgroundColor: "#141416",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          backgroundColor: color,
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#555560",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "0.68rem",
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 0.5,
          mt: 0.5,
          mb: 2.5,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: "2.8rem",
            fontWeight: 700,
            color,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {score}
        </Typography>
        <Typography
          component="span"
          sx={{ fontSize: "0.95rem", color: "#555560", fontWeight: 400 }}
        >
          /100
        </Typography>
      </Box>
      {breakdown.map((b) => (
        <ScoreBreakdownBar key={b.label} {...b} />
      ))}
    </Paper>
  );
}
