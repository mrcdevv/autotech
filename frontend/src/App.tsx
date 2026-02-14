import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router";
import theme from "@/theme/theme";
import HomePage from "@/pages/HomePage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
