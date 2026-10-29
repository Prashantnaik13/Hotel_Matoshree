import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function Protected({ children }){
  const { user } = useAuth();
  if(!user) return <Navigate to="/login" replace/>;
  return children;
}
export function RoleGuard({ roles, children }){
  const { user } = useAuth();
  if(!user) return <Navigate to="/login" replace/>;
  if(!roles.includes(user.role)) return <div className="empty">Forbidden: Insufficient permissions</div>;
  return children;
}
