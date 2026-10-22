import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./design-refinement.css";
import "./surface-polish.css";
import App from "./App.tsx";
import { AppProviders } from "./app/providers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
