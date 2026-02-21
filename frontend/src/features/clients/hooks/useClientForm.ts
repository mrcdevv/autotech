import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { clientsApi } from "@/api/clients";
import type { Client, ClientRequest } from "../types/client";

// Define the validation schema using Zod
const clientSchema = z.object({
    firstName: z.string().min(1, "El nombre es obligatorio.").max(50).regex(/^[a-zA-Z\s]+$/, "El nombre solo puede contener letras y espacios."),
    lastName: z.string().min(1, "El apellido es obligatorio.").max(50).regex(/^[a-zA-Z\s]+$/, "El apellido solo puede contener letras y espacios."),
    phone: z.string().min(1, "El teléfono es obligatorio.").regex(/^\d+$/, "El teléfono solo puede contener números.").refine(val => val.replace(/[^\d]/g, '').length >= 7, "El teléfono debe tener al menos 7 dígitos."),
    email: z.string().email("Formato de email inválido.").optional().or(z.literal("")),
    clientType: z.enum(["PERSONAL", "EMPRESA", "TEMPORAL"]),
    entryDate: z.string().min(1, "La fecha de entrada es obligatoria."),
    commercialName: z.string().optional(),
    dni: z.string().optional().refine((val) => {
        if (!val) return true; // DNI is optional
        return /^\d{8}$/.test(val);
    }, "El DNI debe contener 8 dígitos numéricos."),
    address: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
}).refine(data => {
    // Conditional validation: DNI, address, province, and country are required if clientType is not TEMPORAL
    if (data.clientType !== "TEMPORAL") {
        return !!data.dni && !!data.address && !!data.province && !!data.country;
    }
    return true;
}, {
    message: "DNI, Dirección, Provincia y País son obligatorios para clientes de tipo PERSONAL o EMPRESA.",
    path: ["dni"], // you can specify a path to associate the error with a specific field
});

export type ClientFormData = z.infer<typeof clientSchema>;

interface UseClientFormProps {
    client: Client | null;
}

export function useClientForm({ client }: UseClientFormProps) {
    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            firstName: client?.firstName ?? "",
            lastName: client?.lastName ?? "",
            dni: client?.dni ?? "",
            commercialName: client?.commercialName ?? "",
            email: client?.email ?? "",
            phone: client?.phone ?? "",
            address: client?.address ?? "",
            province: client?.province ?? "",
            country: client?.country ?? "",
            clientType: client?.clientType ?? "PERSONAL",
            entryDate: client?.entryDate ?? new Date().toISOString().split("T")[0],
        },
    });

    const checkDniExists = async (dni: string) => {
        if (!dni) return false;
        try {
            const response = await clientsApi.findByDni(dni);
            // If we are editing a client, we should allow the same DNI
            if (client && response.data?.id === client.id) {
                return false;
            }
            return response.data !== null;
        } catch (error) {
            // If the API returns a 404, it means the DNI does not exist
            return false;
        }
    };

    const onSubmit = async (data: ClientFormData): Promise<Client> => {
        const request: ClientRequest = { ...data, dni: data.dni || null, commercialName: data.commercialName || null, email: data.email || null, address: data.address || null, province: data.province || null, country: data.country || null };

        if (client) {
            // Update
            const response = await clientsApi.update(client.id, request);
            return response.data.data;
        } else {
            // Create
            const response = await clientsApi.create(request);
            return response.data.data;
        }
    };

    return { form, onSubmit, checkDniExists };
}
