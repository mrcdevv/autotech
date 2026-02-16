import { Box } from "@mui/material";

import { EstimateDetail } from "./EstimateDetail";

interface EstimateTabProps {
  repairOrderId: number;
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientDni: string | null;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrandName: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
}

export function EstimateTab({
  repairOrderId,
  clientId,
  clientFirstName,
  clientLastName,
  clientDni,
  vehicleId,
  vehiclePlate,
  vehicleBrandName,
  vehicleModel,
  vehicleYear,
}: EstimateTabProps) {
  return (
    <Box>
      <EstimateDetail
        repairOrderId={repairOrderId}
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
