import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { checkAndMigrateCache } from "./lib/cache-version";

// Verificar e migrar cache antes de renderizar
const cacheResult = checkAndMigrateCache();

// Armazenar resultado para exibir notificação após o app carregar
if (cacheResult.wasUpdated) {
    // Usar sessionStorage para não persistir entre sessões
    sessionStorage.setItem("edusolo-app-updated", "true");
}

createRoot(document.getElementById("root")!).render(<App />);
