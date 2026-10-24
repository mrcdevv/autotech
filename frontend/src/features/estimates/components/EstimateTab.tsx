import { Box } from "@mui/material";

import { EstimateDetail } from "./EstimateDetail";

import type { RepairOrderStatus } from "@/features/repair-orders/types";

interface EstimateTabProps {
  repairOrderId: number;
  repairOrderStatus?: RepairOrderStatus;
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientDni: string | null;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrandName: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  reason: string | null;
  mechanicNotes: string | null;
}

export function EstimateTab({
  repairOrderId,
  repairOrderStatus,
  clientId,
  clientFirstName,
  clientLastName,
  clientDni,
  vehicleId,
  vehiclePlate,
  vehicleBrandName,
  vehicleModel,
  vehicleYear,
  reason,
  mechanicNotes,
}: EstimateTabProps) {
  return (
    <Box>
      <EstimateDetail
        repairOrderId={repairOrderId}
        repairOrderStatus={repairOrderStatus}
        reason={reason}
        mechanicNotes={mechanicNotes}
        repairOrderClient={{
          id: clientId,
          firstName: clientFirstName,
          lastName: clientLastName,
          dni: clientDni,
        }}
        repairOrderVehicle={{
          id: vehicleId,
          plate: vehiclePlate,
          brandName: vehicleBrandName,
          model: vehicleModel,
          year: vehicleYear,
        }}
      />
    </Box>
  );
}
