import { useState } from "react";

import { Divider, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import type { AppointmentResponse } from "@/types/appointment";

interface AppointmentActionsProps {
  appointment: AppointmentResponse;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

export function AppointmentActions({
  appointment,
  onMarkClientArrived,
  onMarkVehicleArrived,
  onEdit,
  onDelete,
}: AppointmentActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onMarkClientArrived(appointment.id, !appointment.clientArrived);
            setAnchorEl(null);
          }}
        >
          {appointment.clientArrived ? "Desmarcar cliente presente" : "Marcar cliente presente"}
        </MenuItem>

        {!appointment.vehicleArrivedAt && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMarkVehicleArrived(appointment.id);
              setAnchorEl(null);
            }}
          >
            Marcar vehículo recibido
          </MenuItem>
        )}

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit(appointment);
            setAnchorEl(null);
          }}
        >
          Editar fecha y hora
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete(appointment.id);
            setAnchorEl(null);
          }}
          sx={{ color: "error.main" }}
        >
          Eliminar cita
        </MenuItem>
      </Menu>
    </>
  );
}
