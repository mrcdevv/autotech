import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router";

import theme from "@/theme/theme";
import AppRoutes from "@/routes";
import { AuthProvider } from "@/features/auth/context/AuthContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
