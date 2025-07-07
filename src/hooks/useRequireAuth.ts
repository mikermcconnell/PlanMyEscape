import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Redirects the user to the sign-in page if not authenticated.
 * Returns the user object when logged in.
 */
export const useRequireAuth = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate('/signin');
    }
  }, [user, navigate]);

  return user;
}; 