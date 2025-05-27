import { Toaster } from "sonner";
import { AppRoutes } from "./routes/AppRoutes";
import { SocketProvider } from "@/contexts/SocketContext";
import { AuthProvider } from "@/store/auth-store";

function App() {
  return (
    <>
      <AuthProvider>
        <SocketProvider>
          <Toaster richColors position="top-right" />
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </>
  );
}

export default App;
