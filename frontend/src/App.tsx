import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router";

import theme from "@/theme/theme";
import AppRoutes from "@/routes";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
