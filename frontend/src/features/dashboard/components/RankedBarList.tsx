import { Box, Stack, Typography } from "@mui/material";

interface RankedBarListItem {
  label: string;
  value: number;
}

interface RankedBarListProps {
  data: RankedBarListItem[];
  colors: { light: string; base: string };
}

export function RankedBarList({ data, colors }: RankedBarListProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <Stack spacing={2}>
      {data.map((item, index) => (
        <Box key={item.label}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 2,
              mb: 0.75,
            }}
          >
            <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
              {item.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
            >
              {item.value}
            </Typography>
          </Box>
          <Box
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#EFEDE6",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${(item.value / max) * 100}%`,
                borderRadius: 4,
                background: `linear-gradient(90deg, ${colors.light}, ${colors.base})`,
                transformOrigin: "left center",
                animation: "growBar 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
                animationDelay: `${index * 70}ms`,
                "@keyframes growBar": {
                  from: { transform: "scaleX(0)" },
                  to: { transform: "scaleX(1)" },
                },
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
