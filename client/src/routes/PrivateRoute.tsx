import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

interface Props {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <p>Carregando...</p>;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
