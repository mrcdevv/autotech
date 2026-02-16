import { useState } from "react";

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router";

import { StatusUpdateDialog } from "./StatusUpdateDialog";
import { STATUS_LABELS } from "../types";

import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

interface RepairOrderCardProps {
  order: RepairOrderResponse;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
}

export function RepairOrderCard({ order, onUpdateStatus }: RepairOrderCardProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

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

  const handleEditClick = () => {
    setAnchorEl(null);
    navigate(`/ordenes-trabajo/${order.id}`);
  };

  return (
    <>
      <Card sx={{ mb: 1, cursor: "pointer" }} onClick={handleCardClick}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip label={STATUS_LABELS[order.status]} size="small" variant="outlined" />
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Typography variant="caption" color="text.secondary">
            OT-{order.id}
          </Typography>

          <Typography variant="subtitle2">
            {order.clientFirstName} {order.clientLastName}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {order.clientPhone}
          </Typography>

          <Typography variant="body2">
            {[order.vehicleYear, order.vehicleBrandName, order.vehicleModel]
              .filter(Boolean)
              .join(" ")}{" "}
            | {order.vehiclePlate}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {new Date(order.createdAt).toLocaleDateString("es-AR")}
          </Typography>

          {order.employees.length > 0 && (
            <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
              {order.employees.map((emp) => (
                <Chip key={emp.id} label={`${emp.firstName} ${emp.lastName}`} size="small" />
              ))}
            </Box>
          )}

          {order.tags.length > 0 && (
            <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
              {order.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{ backgroundColor: tag.color || undefined }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setStatusDialogOpen(true);
          }}
        >
          Actualizar estado
        </MenuItem>
        <MenuItem onClick={handleCopyTrackingCode}>Copiar código de seguimiento</MenuItem>
        <MenuItem onClick={handleEditClick}>Editar</MenuItem>
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
    </>
  );
}
