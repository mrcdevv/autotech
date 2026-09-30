import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import {
  Button,
  Autocomplete,
  TextField,
  Tabs,
  Tab,
  Box,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { AppSearchField } from "@/components/AppSearchField";
import { MonoText } from "@/components/MonoText";
import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
import { employeesApi } from "@/api/employees";
import { tagsApi } from "@/api/tags";
import { KanbanBoard } from "@/features/repair-orders/components/KanbanBoard";
import { RepairOrderHistory } from "@/features/repair-orders/components/RepairOrderHistory";
import { useRepairOrders } from "@/features/repair-orders/hooks/useRepairOrders";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/features/repair-orders/types";

import type { GridPaginationModel } from "@mui/x-data-grid";
import type { EmployeeSummaryResponse, TagResponse } from "@/types/appointment";
import type { RepairOrderListParams } from "@/api/repairOrders";
import type { RepairOrderResponse, StatusUpdateRequest } from "@/features/repair-orders/types";

const BOARD_LIMIT = 200;
// Recent closures stay on the board for this many days before only living in the history.
const RECENT_CLOSED_DAYS = 30;

type TabKey = "kanban" | "historial";

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function RepairOrdersPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [tagId, setTagId] = useState<number | null>(null);
  const [showFinished, setShowFinished] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [historyPagination, setHistoryPagination] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 12,
  });

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

  const query = searchQuery.trim() || undefined;
  const closedSince = daysAgoIso(RECENT_CLOSED_DAYS);

  // Board = all active orders + orders closed within the last N days.
  const activeParams: RepairOrderListParams = {
    statuses: ACTIVE_STATUSES,
    q: query,
    employeeId: employeeId ?? undefined,
    tagId: tagId ?? undefined,
    size: BOARD_LIMIT,
  };

  const recentClosedParams: RepairOrderListParams = {
    statuses: CLOSED_STATUSES,
    q: query,
    employeeId: employeeId ?? undefined,
    tagId: tagId ?? undefined,
    from: closedSince,
    size: BOARD_LIMIT,
  };

  const historyParams: RepairOrderListParams = {
    statuses: CLOSED_STATUSES,
    q: query,
    from: from || undefined,
    to: to || undefined,
    page: historyPagination.page,
    size: historyPagination.pageSize,
  };

  const active = useRepairOrders(activeParams);
  const recentClosed = useRepairOrders(recentClosedParams);
  const history = useRepairOrders(historyParams);

  const boardOrders: RepairOrderResponse[] = showFinished
    ? [...active.orders, ...recentClosed.orders]
    : active.orders;
  const boardLoading = active.loading || recentClosed.loading;

  const refetchBoard = () => {
    active.refetch();
    recentClosed.refetch();
  };

  const updateBoardStatus = async (id: number, request: StatusUpdateRequest) => {
    await active.updateStatus(id, request);
    await recentClosed.refetch();
  };

  const handleTabChange = (_event: React.SyntheticEvent, value: TabKey) => {
    setTab(value);
  };

  return (
    <PageShell title="Órdenes de trabajo">
      <PageToolbar
        filters={
          <>
            <AppSearchField
              placeholder="Buscar por título, nombre, patente, marca, modelo..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHistoryPagination((prev) => ({ ...prev, page: 0 }));
              }}
              sx={{ width: { xs: "100%", md: 380 }, minWidth: 300 }}
            />
            {tab === "kanban" ? (
              <>
                <Autocomplete
                  options={employees}
                  getOptionLabel={(e) => `${e.firstName} ${e.lastName}`}
                  value={employees.find((e) => e.id === employeeId) ?? null}
                  onChange={(_, value) => setEmployeeId(value ? value.id : null)}
                  renderInput={(params) => (
                    <TextField {...params} label="Filtrar por empleado" size="small" />
                  )}
                  sx={{ minWidth: 220 }}
                />
                <Autocomplete
                  options={tags}
                  getOptionLabel={(t) => t.name}
                  value={tags.find((t) => t.id === tagId) ?? null}
                  onChange={(_, value) => setTagId(value ? value.id : null)}
                  renderInput={(params) => (
                    <TextField {...params} label="Filtrar por etiqueta" size="small" />
                  )}
                  sx={{ minWidth: 220 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={showFinished}
                      onChange={(e) => setShowFinished(e.target.checked)}
                    />
                  }
                  label="Mostrar finalizadas"
                  sx={{ ml: 0.5 }}
                />
                <MonoText sx={{ fontSize: "0.6875rem", color: "text.secondary" }}>
                  {boardOrders.length} en el tablero
                </MonoText>
              </>
            ) : (
              <>
                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setHistoryPagination((prev) => ({ ...prev, page: 0 }));
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ minWidth: 170 }}
                />
                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setHistoryPagination((prev) => ({ ...prev, page: 0 }));
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ minWidth: 170 }}
                />
                <MonoText sx={{ fontSize: "0.6875rem", color: "text.secondary" }}>
                  {history.totalElements} finalizadas
                </MonoText>
              </>
            )}
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

      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Tablero" value="kanban" />
          <Tab label="Historial" value="historial" />
        </Tabs>
      </Box>

      {tab === "kanban" ? (
        <KanbanBoard
          orders={boardOrders}
          loading={boardLoading}
          onUpdateStatus={updateBoardStatus}
          onRefetch={refetchBoard}
        />
      ) : (
        <RepairOrderHistory
          rows={history.orders}
          loading={history.loading}
          rowCount={history.totalElements}
          paginationModel={historyPagination}
          onPaginationModelChange={setHistoryPagination}
        />
      )}
    </PageShell>
  );
}
