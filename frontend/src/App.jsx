import AppRoutes from "./routes";
import { AuthProvider } from "./auth/useAuth";
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
