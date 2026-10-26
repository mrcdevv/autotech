import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

import { FORBIDDEN_EVENT } from "@/api/client";

/** Shows a global message whenever the API rejects an action for missing permissions. */
export function ForbiddenNotifier() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(FORBIDDEN_EVENT, show);
    return () => window.removeEventListener(FORBIDDEN_EVENT, show);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity="warning" variant="filled" onClose={() => setOpen(false)}>
        No tiene permisos para realizar esta acción
      </Alert>
    </Snackbar>
  );
}
