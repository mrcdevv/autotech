import { useState } from "react";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Stack,
  TextField,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";

import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { inspectionsApi } from "@/api/inspections";

import type { InspectionResponse, InspectionItemStatus, InspectionItemRequest } from "@/features/inspections/types";

interface InspectionFormProps {
  repairOrderId: number;
  inspection: InspectionResponse;
  onSaved: () => void;
  onDeleted: () => void;
}

export function InspectionForm({
  repairOrderId,
  inspection,
  onSaved,
  onDeleted,
}: InspectionFormProps) {
  const [itemStates, setItemStates] = useState<
    Record<number, { status: InspectionItemStatus; comment: string | null }>
  >(() => {
    const map: Record<number, { status: InspectionItemStatus; comment: string | null }> = {};
    inspection.groups.forEach((group) => {
      group.items.forEach((item) => {
        map[item.id] = { status: item.status, comment: item.comment };
      });
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStatusChange = (itemId: number, status: InspectionItemStatus) => {
    setItemStates((prev) => {
      const existing = prev[itemId] ?? { status: "NO_APLICA" as InspectionItemStatus, comment: null };
      return { ...prev, [itemId]: { ...existing, status } };
    });
  };

  const handleCommentChange = (itemId: number, comment: string) => {
    setItemStates((prev) => {
      const existing = prev[itemId] ?? { status: "NO_APLICA" as InspectionItemStatus, comment: null };
      return { ...prev, [itemId]: { ...existing, comment: comment || null } };
    });
  };

  const handleSave = async () => {
    const items: InspectionItemRequest[] = Object.entries(itemStates).map(([id, state]) => ({
      id: Number(id),
      status: state.status,
      comment: state.comment,
    }));
    setSaving(true);
    try {
      await inspectionsApi.saveItems(repairOrderId, inspection.id, { items });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await inspectionsApi.delete(repairOrderId, inspection.id);
    onDeleted();
    setDeleteDialogOpen(false);
  };

  return (
    <Card
      sx={{
        mb: 3,
        border: "1px solid",
        borderColor: "divider",
        "@media print": {
          border: "none",
          boxShadow: "none",
          mb: 1.5,
          pageBreakInside: "avoid",
        },
      }}
      elevation={0}
    >
      <CardContent
        sx={{
          pb: 1,
          "@media print": {
            p: 0,
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mb: 2,
            "@media print": {
              mb: 0.5,
            },
          }}
        >
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              "@media print": {
                fontSize: "0.9rem",
                fontWeight: "700",
              },
            }}
          >
            {inspection.templateTitle}
          </Typography>
          <IconButton
            onClick={() => setDeleteDialogOpen(true)}
            color="error"
            title="Eliminar inspección"
            size="small"
            className="no-print"
          >
            <DeleteIcon />
          </IconButton>
        </Stack>

        {inspection.groups.map((group, groupIndex) => (
          <Box
            key={group.groupId}
            sx={{
              "@media print": {
                pageBreakInside: "avoid",
              },
            }}
          >
            {groupIndex > 0 && (
              <Divider
                sx={{
                  my: 2.5,
                  "@media print": {
                    display: "none",
                  },
                }}
              />
            )}
            <Typography
              variant="subtitle1"
              fontWeight="600"
              sx={{
                mb: 1.5,
                "@media print": {
                  fontSize: "0.9rem",
                  mb: 0.3,
                  mt: groupIndex > 0 ? 0.5 : 0,
                },
              }}
            >
              {group.groupTitle}
            </Typography>

            <Stack
              spacing={1.5}
              sx={{
                "@media print": {
                  spacing: 0,
                },
              }}
            >
              {group.items.map((item) => {
                const itemState = itemStates[item.id];
                const status = itemState?.status ?? "NO_APLICA";
                const comment = itemState?.comment;

                const getStatusLabel = (st: InspectionItemStatus) => {
                  switch (st) {
                    case "OK":
                      return "OK";
                    case "REVISAR":
                      return "Revisar";
                    case "PROBLEMA":
                      return "Problema";
                    case "NO_APLICA":
                      return "N/A";
                  }
                };

                const getStatusIcon = (st: InspectionItemStatus) => {
                  switch (st) {
                    case "OK":
                      return <CheckCircleIcon sx={{ fontSize: 14 }} />;
                    case "REVISAR":
                      return <WarningIcon sx={{ fontSize: 14 }} />;
                    case "PROBLEMA":
                      return <ErrorIcon sx={{ fontSize: 14 }} />;
                    case "NO_APLICA":
                      return <RemoveCircleOutlineIcon sx={{ fontSize: 14 }} />;
                  }
                };

                return (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "grey.50",
                      "@media print": {
                        bgcolor: "transparent",
                        p: 0,
                        py: 0.2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        borderBottom: "none",
                        pageBreakInside: "avoid",
                      },
                    }}
                  >
                    {/* Screen version */}
                    <Stack spacing={1.5} className="no-print">
                      <Typography variant="body2" fontWeight="500" color="text.primary">
                        {item.templateItemName}
                      </Typography>

                      <ToggleButtonGroup
                        value={status}
                        exclusive
                        onChange={(_, value) => {
                          if (value !== null) {
                            handleStatusChange(item.id, value as InspectionItemStatus);
                          }
                        }}
                        size="small"
                        fullWidth
                        sx={{
                          "& .MuiToggleButton-root": {
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            "&.Mui-selected": {
                              borderColor: "divider",
                            },
                          },
                        }}
                      >
                        <ToggleButton
                          value="OK"
                          sx={{
                            "&.Mui-selected": {
                              bgcolor: "success.light",
                              color: "success.dark",
                              "&:hover": { bgcolor: "success.light" },
                            },
                          }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 18, mr: 0.5 }} />
                          OK
                        </ToggleButton>
                        <ToggleButton
                          value="REVISAR"
                          sx={{
                            "&.Mui-selected": {
                              bgcolor: "warning.light",
                              color: "warning.dark",
                              "&:hover": { bgcolor: "warning.light" },
                            },
                          }}
                        >
                          <WarningIcon sx={{ fontSize: 18, mr: 0.5 }} />
                          Revisar
                        </ToggleButton>
                        <ToggleButton
                          value="PROBLEMA"
                          sx={{
                            "&.Mui-selected": {
                              bgcolor: "error.light",
                              color: "error.dark",
                              "&:hover": { bgcolor: "error.light" },
                            },
                          }}
                        >
                          <ErrorIcon sx={{ fontSize: 18, mr: 0.5 }} />
                          Problema
                        </ToggleButton>
                        <ToggleButton
                          value="NO_APLICA"
                          sx={{
                            "&.Mui-selected": {
                              bgcolor: "grey.300",
                              color: "text.primary",
                              "&:hover": { bgcolor: "grey.300" },
                            },
                          }}
                        >
                          <RemoveCircleOutlineIcon sx={{ fontSize: 18, mr: 0.5 }} />
                          N/A
                        </ToggleButton>
                      </ToggleButtonGroup>

                      {(comment || status !== "OK") && (
                        <TextField
                          size="small"
                          placeholder="Comentario (opcional)"
                          value={comment ?? ""}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          fullWidth
                          multiline
                          maxRows={3}
                          sx={{
                            "& .MuiInputBase-root": {
                              bgcolor: "background.paper",
                              py: 1,
                            },
                          }}
                        />
                      )}
                    </Stack>

                    {/* Print version */}
                    <Box
                      sx={{
                        display: "none",
                        "@media print": {
                          display: "flex",
                          width: "100%",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                        },
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          • {item.templateItemName}
                        </Typography>
                        {comment && (
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.85rem", color: "#666", ml: 1.5, fontStyle: "italic" }}
                          >
                            {comment}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, minWidth: 60 }}>
                        {getStatusIcon(status)}
                        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {getStatusLabel(status)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </CardContent>
      <CardActions className="no-print">
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </CardActions>

      <AppConfirmDialog
        open={deleteDialogOpen}
        className="no-print"
        title="Eliminar inspección"
        message="¿Está seguro de que desea eliminar esta inspección? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Card>
  );
}
