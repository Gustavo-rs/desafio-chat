import { Toaster } from "sonner";
import { AppRoutes } from "./routes/AppRoutes";
import { SocketProvider } from "@/contexts/SocketContext";

function App() {
  return (
    <>
      <SocketProvider>
        <Toaster richColors position="top-right" />
        <AppRoutes />
      </SocketProvider>
    </>
  );
}

export default App;
