export interface VehicleResponse {
  id: number;
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientDni: string | null;
  plate: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  brandId: number | null;
  brandName: string | null;
  model: string | null;
  year: number | null;
  vehicleTypeId: number | null;
  vehicleTypeName: string | null;
  observations: string | null;
  createdAt: string;
}

export interface VehicleRequest {
  clientId: number;
  plate: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  brandId: number | null;
  model: string | null;
  year: number | null;
  vehicleTypeId: number | null;
  observations: string | null;
}

export interface BrandResponse {
  id: number;
  name: string;
  createdAt: string;
}

export interface BrandRequest {
  name: string;
}

export interface VehicleTypeResponse {
  id: number;
  name: string;
}

export interface ClientAutocompleteResponse {
  id: number;
  firstName: string;
  lastName: string;
  dni: string | null;
}
