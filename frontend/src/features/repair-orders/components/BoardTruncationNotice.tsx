import { Alert } from "@mui/material";

interface BoardTruncationNoticeProps {
  /** Orders actually loaded onto the board. */
  shown: number;
  /** Orders matching the current filters, including those past the limit. */
  total: number;
}

export function BoardTruncationNotice({ shown, total }: BoardTruncationNoticeProps) {
  if (total <= shown) return null;

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      El tablero muestra {shown} de {total} órdenes. Ajusta los filtros para ver las que faltan.
    </Alert>
  );
}
