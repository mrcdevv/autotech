import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router";
import theme from "@/theme/theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* TODO: Add routes and layout */}
        <div>Autotech - Mechanical Workshop Management</div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
