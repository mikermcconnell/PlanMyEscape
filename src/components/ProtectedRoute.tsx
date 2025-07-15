import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactElement;
  allowUnauthenticated?: boolean;
}

const ProtectedRoute = ({ children, allowUnauthenticated = false }: ProtectedRouteProps) => {
  const { user } = useContext(AuthContext);

  if (!user && !allowUnauthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute; 