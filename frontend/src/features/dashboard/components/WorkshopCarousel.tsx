import { useEffect, useState } from "react";

import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { MonoText } from "@/components/MonoText";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { font } from "@/theme/tokens";
import type { WorkshopCarouselItem } from "@/features/dashboard/utils/homeView";

interface WorkshopCarouselProps {
  items: WorkshopCarouselItem[];
  onOpen: (id: number) => void;
}

const navSx = {
  width: 28,
  height: 28,
  borderRadius: "4px",
  border: "1px solid",
  borderColor: "grey.400",
  color: "text.secondary",
  "&:hover": { bgcolor: "grey.200" },
  "&.Mui-disabled": { color: "text.disabled", borderColor: "divider" },
};

export function WorkshopCarousel({ items, onOpen }: WorkshopCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count === 0) {
      setIndex(0);
    } else if (index > count - 1) {
      setIndex(count - 1);
    }
  }, [count, index]);

  const move = (delta: number) => {
    if (count === 0) return;
    setIndex((prev) => (prev + delta + count) % count);
  };

  const item = items[index];

  return (
    <Box
      data-testid="workshop-carousel"
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        mb: "16px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: "20px",
          py: "12px",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <Typography variant="overline" sx={{ color: "text.muted" }}>
            Taller
          </Typography>
          <MonoText sx={{ fontSize: "0.6875rem", color: "text.secondary" }}>
            {count} {count === 1 ? "vehículo" : "vehículos"} en taller
          </MonoText>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MonoText sx={{ fontSize: "0.6875rem", color: "text.secondary" }}>
            {count === 0 ? "0 / 0" : `${index + 1} / ${count}`}
          </MonoText>
          <IconButton
            size="small"
            aria-label="Vehículo anterior"
            onClick={() => move(-1)}
            disabled={count <= 1}
            sx={navSx}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Vehículo siguiente"
            onClick={() => move(1)}
            disabled={count <= 1}
            sx={navSx}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {item ? (
        <Box
          role="button"
          tabIndex={0}
          aria-label={`Abrir ${item.ot}`}
          onClick={() => onOpen(item.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen(item.id);
            }
          }}
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 1.2fr) minmax(0, 1fr)",
            },
            gap: "24px",
            p: "20px",
            overflow: "hidden",
            cursor: "pointer",
            "&:hover": { bgcolor: "grey.50" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: -2,
            },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              right: 8,
              bottom: -18,
              fontFamily: font.sans,
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: "1px #E4E1D8",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {item.position}
          </Box>

          <Box sx={{ position: "relative", minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "10px" }}>
              <StatusBadge tone={item.tone} label={item.statusLabel} />
              <MonoText
                sx={{
                  fontSize: "0.625rem",
                  color: "text.muted",
                  border: "1px solid",
                  borderColor: "divider",
                  px: "6px",
                  py: "1px",
                }}
              >
                {item.puesto}
              </MonoText>
            </Box>
            <Typography
              sx={{
                fontSize: "1.375rem",
                fontWeight: 650,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.vehicle}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                color: "text.muted",
                mt: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.client}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mt: "14px" }}>
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  bgcolor: "shell.avatarBg",
                  color: "text.primary",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                }}
              >
                {item.initials}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <MonoText sx={{ display: "block", fontSize: "0.625rem", color: "text.secondary" }}>
                  {item.ot}
                </MonoText>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "text.muted",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.mechanic}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ position: "relative", minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Qué se le tiene que hacer
            </Typography>
            <Typography sx={{ fontSize: "0.9375rem", fontWeight: 500, mt: "6px", mb: "14px" }}>
              {item.task}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "6px",
              }}
            >
              <MonoText sx={{ fontSize: "0.6875rem", color: "text.secondary" }}>
                {item.plate}
              </MonoText>
              <MonoText sx={{ fontSize: "0.6875rem", color: item.color }}>
                {item.progress}%
              </MonoText>
            </Box>
            <ProgressBar value={item.progress} color={item.color} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: "28px 20px", textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No hay vehículos en el taller
          </Typography>
        </Box>
      )}

      {count > 1 && (
        <Box
          sx={{
            display: "flex",
            gap: "4px",
            px: "20px",
            py: "12px",
            borderTop: "1px solid",
            borderColor: "divider",
            overflowX: "auto",
          }}
        >
          {items.map((entry, entryIndex) => {
            const active = entryIndex === index;

            return (
              <Box
                key={entry.id}
                component="button"
                type="button"
                aria-label={`Ir a ${entry.ot}`}
                aria-pressed={active}
                onClick={() => setIndex(entryIndex)}
                sx={{
                  flex: "none",
                  width: 22,
                  height: 22,
                  border: "1px solid",
                  borderColor: active ? "primary.main" : "grey.400",
                  bgcolor: active ? "primary.main" : "transparent",
                  color: active ? "primary.contrastText" : "text.secondary",
                  fontFamily: font.mono,
                  fontSize: "0.625rem",
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                {entry.position}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
