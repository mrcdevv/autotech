import { useState } from "react";

import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Stack,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import { useNavigate } from "react-router";

import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";
import { initials } from "@/utils/initials";

import { AssignMechanicsDialog } from "./AssignMechanicsDialog";
import { StatusUpdateDialog } from "./StatusUpdateDialog";
import { STATUS_META } from "../statusMeta";

import type { ReactNode } from "react";
import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

interface RepairOrderCardProps {
  order: RepairOrderResponse;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
  onRefetch: () => void;
}

export function RepairOrderCard({ order, onUpdateStatus, onRefetch }: RepairOrderCardProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const meta = STATUS_META[order.status];
  const created = new Date(order.createdAt);
  const dateLabel = created.toLocaleDateString("es-AR");
  const timeLabel = created.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const vehicleLabel =
    [order.vehicleYear, order.vehicleBrandName, order.vehicleModel].filter(Boolean).join(" ") ||
    "Vehículo";
  const employee = order.employees[0];

  const handleCardClick = () => {
    navigate(`/ordenes-trabajo/${order.id}`);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleCopyTrackingCode = () => {
    navigator.clipboard.writeText(String(order.id));
    setAnchorEl(null);
  };

  const handleOpenAssign = () => {
    setAnchorEl(null);
    setAssignDialogOpen(true);
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          "&:hover": { bgcolor: "grey.50" },
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 36,
                height: 36,
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: meta.color,
                color: "#FFFFFF",
              }}
            >
              <MonoText sx={{ fontSize: "0.75rem", fontWeight: 700 }}>OT-{order.id}</MonoText>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.9375rem",
                  fontWeight: 650,
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {order.clientFirstName} {order.clientLastName}
              </Typography>
            </Box>

            <StatusBadge tone={meta.tone} label={meta.label} />
            <IconButton size="small" aria-label="Opciones de la orden" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 1,
              mt: 1,
              mb: 1.25,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {order.title ?? meta.label}
            </Typography>
            <MonoText sx={{ fontSize: "0.6875rem", color: "text.secondary", flex: "none" }}>
              {dateLabel} · {timeLabel}
            </MonoText>
          </Box>

          <Stack
            divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}
            spacing={0.75}
            sx={{ mb: 1.5 }}
          >
            <InfoRow label="Vehículo">
              <Typography component="span" sx={{ fontSize: "0.8125rem", color: "text.muted" }}>
                {vehicleLabel}{" "}
              </Typography>
              <MonoText sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {order.vehiclePlate}
              </MonoText>
            </InfoRow>
            <InfoRow label="Teléfono">
              <MonoText sx={{ fontSize: "0.75rem", color: "text.muted" }}>
                {order.clientPhone}
              </MonoText>
            </InfoRow>
            <InfoRow label="Mecánico">
              {employee ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      flex: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      bgcolor: "shell.avatarBg",
                      color: "text.primary",
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                    }}
                  >
                    {initials(employee.firstName, employee.lastName)}
                  </Box>
                  <Typography sx={{ fontSize: "0.8125rem", color: "text.muted" }}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ fontSize: "0.8125rem", color: "text.disabled" }}>
                  Sin asignar
                </Typography>
              )}
            </InfoRow>
          </Stack>

          {order.tags.length > 0 && (
            <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
              {order.tags.map((tag) => (
                <Box
                  key={tag.id}
                  component="span"
                  sx={{
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    px: "7px",
                    py: "2px",
                    borderRadius: "4px",
                    bgcolor: tag.color || "grey.200",
                    color: "#FFFFFF",
                  }}
                >
                  {tag.name}
                </Box>
              ))}
            </Box>
          )}

          <Stack
            direction="row"
            spacing={1}
            sx={{ pt: 1.25, borderTop: "1px solid", borderColor: "divider" }}
          >
            <Button
              fullWidth
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              Ver detalle
            </Button>
            <Button
              fullWidth
              size="small"
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                setStatusDialogOpen(true);
              }}
            >
              Actualizar estado
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={handleOpenAssign} sx={{ gap: 1 }}>
          <PersonAddAltOutlinedIcon fontSize="small" /> Asignar mecánico
        </MenuItem>
        <MenuItem onClick={handleCopyTrackingCode}>Copiar código de seguimiento</MenuItem>
      </Menu>

      <StatusUpdateDialog
        open={statusDialogOpen}
        currentStatus={order.status}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={(newStatus) => {
          onUpdateStatus(order.id, { newStatus });
          setStatusDialogOpen(false);
        }}
      />

      <AssignMechanicsDialog
        open={assignDialogOpen}
        orderId={order.id}
        assigned={order.employees}
        onClose={() => setAssignDialogOpen(false)}
        onSuccess={onRefetch}
      />
    </>
  );
}

interface InfoRowProps {
  label: string;
  children: ReactNode;
}

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="overline" sx={{ color: "text.faint", flex: "none" }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {children}
      </Box>
    </Box>
  );
}
