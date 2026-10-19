import { Divider, Menu, MenuItem } from "@mui/material";

import type { AppointmentResponse } from "@/types/appointment";

interface AppointmentActionsMenuProps {
  anchorEl: HTMLElement | null;
  appointment: AppointmentResponse | null;
  onClose: () => void;
  onMarkVehicleArrived?: (id: number) => void;
  onEdit?: (appointment: AppointmentResponse) => void;
  onCancel?: (id: number) => void;
  onDelete?: (id: number) => void;
  onCreateWorkOrder?: (appointment: AppointmentResponse) => void;
}

export function AppointmentActionsMenu({
  anchorEl,
  appointment,
  onClose,
  onMarkVehicleArrived,
  onEdit,
  onCancel,
  onDelete,
  onCreateWorkOrder,
}: AppointmentActionsMenuProps) {
  if (!appointment) return null;

  const isCancelled = appointment.status === "CANCELLED";

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      onClick={(e) => e.stopPropagation()}
    >
      {onMarkVehicleArrived && !appointment.vehicleArrivedAt && !isCancelled && (
        <MenuItem
          onClick={() => {
            onMarkVehicleArrived(appointment.id);
            onClose();
          }}
        >
          Marcar vehículo recibido
        </MenuItem>
      )}

      {onEdit && (
        <MenuItem
          onClick={() => {
            onEdit(appointment);
            onClose();
          }}
        >
          Editar fecha y hora
        </MenuItem>
      )}

      {onCreateWorkOrder && !isCancelled && (
        <MenuItem
          onClick={() => {
            onCreateWorkOrder(appointment);
            onClose();
          }}
        >
          Crear orden de trabajo
        </MenuItem>
      )}

      {(onCancel || onDelete) && <Divider />}

      {onCancel && !isCancelled && (
        <MenuItem
          onClick={() => {
            onCancel(appointment.id);
            onClose();
          }}
          sx={{ color: "warning.main" }}
        >
          Cancelar cita
        </MenuItem>
      )}

      {onDelete && (
        <MenuItem
          onClick={() => {
            onDelete(appointment.id);
            onClose();
          }}
          sx={{ color: "error.main" }}
        >
          Eliminar cita
        </MenuItem>
      )}
    </Menu>
  );
}
