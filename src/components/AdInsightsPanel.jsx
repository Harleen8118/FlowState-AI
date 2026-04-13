import { Box, Paper, Typography, Chip, Grid } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";

const fieldLabels = [
  ["Headline", "headline"],
  ["Sub-headline", "subheadline"],
  ["Call to Action", "cta"],
  ["Tone", "tone"],
  ["Target Audience", "targetAudience"],
  ["Key Benefit", "keyBenefit"],
  ["Pain Point", "painPoint"],
  ["Offer Details", "offerDetails"],
  ["Urgency Level", "urgencyLevel"],
  ["Social Proof", "socialProofHints"],
];

export default function AdInsightsPanel({ insights }) {
  if (!insights) return null;

  const fields = fieldLabels.filter(([, key]) => insights[key]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: "#1A1A1D",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(232,100,58,0.12)",
            border: "1px solid rgba(232,100,58,0.18)",
          }}
        >
          <BarChartIcon sx={{ fontSize: 18, color: "#E8643A" }} />
        </Box>
        <Typography variant="h6" sx={{ fontSize: "0.95rem", color: "#F0F0F2" }}>
          What we found in your ad
        </Typography>
      </Box>

      <Grid container spacing={1.2}>
        {fields.map(([label, key]) => (
          <Grid size={{ xs: 12, sm: 6 }} key={key}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: "#141416",
                border: "1px solid rgba(255,255,255,0.04)",
                height: "100%",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#E8643A",
                  fontSize: "0.67rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#D0D0D8",
                  mt: 0.3,
                  fontSize: "0.84rem",
                  lineHeight: 1.5,
                }}
              >
                {insights[key]}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {insights.keywords?.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 0.7 }}>
          {insights.keywords.map((kw) => (
            <Chip
              key={kw}
              label={kw}
              size="small"
              sx={{
                backgroundColor: "rgba(232,100,58,0.08)",
                color: "#E8643A",
                fontSize: "0.73rem",
                fontWeight: 500,
                border: "1px solid rgba(232,100,58,0.15)",
                height: 24,
              }}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}
