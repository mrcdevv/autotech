import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

import { Button, Autocomplete, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { AppSearchField } from "@/components/AppSearchField";
import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
import { employeesApi } from "@/api/employees";
import { tagsApi } from "@/api/tags";
import { KanbanBoard } from "@/features/repair-orders/components/KanbanBoard";
import { useRepairOrders } from "@/features/repair-orders/hooks/useRepairOrders";

import type { EmployeeSummaryResponse, TagResponse } from "@/types/appointment";

export default function RepairOrdersPage() {
  const { orders, loading, refetch, searchOrders, filterByEmployee, filterByTag, updateStatus } =
    useRepairOrders();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeSummaryResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);

  useEffect(() => {
    employeesApi.getAll(0, 1000).then((res) => {
      setEmployees(
        res.data.data.content.map((e) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName })),
      );
    });
    tagsApi.getAll().then((res) => setTags(res.data.data));
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      const timer = setTimeout(() => {
        if (value.trim()) {
          searchOrders(value);
        } else {
          refetch();
        }
      }, 300);
      return () => clearTimeout(timer);
    },
    [searchOrders, refetch],
  );

  return (
    <PageShell title="Órdenes de trabajo">
      <PageToolbar
        filters={
          <>
            <AppSearchField
              placeholder="Buscar por título, nombre, patente, marca, modelo..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              sx={{ width: { xs: "100%", md: 420 }, minWidth: 320 }}
            />
            <Autocomplete
              options={employees}
              getOptionLabel={(e) => `${e.firstName} ${e.lastName}`}
              onChange={(_, value) => {
                if (value) {
                  filterByEmployee(value.id);
                } else {
                  refetch();
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Filtrar por empleado" size="small" />
              )}
              sx={{ minWidth: 220 }}
            />
            <Autocomplete
              options={tags}
              getOptionLabel={(t) => t.name}
              onChange={(_, value) => {
                if (value) {
                  filterByTag(value.id);
                } else {
                  refetch();
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Filtrar por etiqueta" size="small" />
              )}
              sx={{ minWidth: 220 }}
            />
          </>
        }
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/ordenes-trabajo/nueva")}
          >
            Nueva orden
          </Button>
        }
      />

      <KanbanBoard
        orders={orders}
        loading={loading}
        onUpdateStatus={updateStatus}
        onRefetch={refetch}
      />
    </PageShell>
  );
}
