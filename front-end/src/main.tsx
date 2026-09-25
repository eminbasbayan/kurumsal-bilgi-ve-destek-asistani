import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "./index.css";
import App from "./app/App.tsx";
import { AppTheme } from "./components/ThemeToggleButton.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppTheme>
      <App />
    </AppTheme>
  </StrictMode>,
);
