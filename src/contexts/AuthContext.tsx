/**
 * AuthContext
 * Global authentication state management
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '@/services/api';
import type { User } from '@/services/api/AuthService';

// Define AuthState inline since we removed the types directory
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true, // Start with loading true for initialization
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth context type
interface AuthContextType extends AuthState {
  loading: boolean; // Alias for isLoading for backward compatibility
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Add timeout to prevent hanging initialization
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
        );
        
        const authPromise = authService.initializeAuth();
        const user = await Promise.race([authPromise, timeoutPromise]);
        
        if (user) {
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
        // Clear any potentially stale tokens on initialization failure
        authService.clearStoredToken();
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      await authService.login(username, password);
      
      // Get user information
      const user = await authService.getCurrentUser();
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: {
            id: user.id,
            email: user.email,
            is_active: user.is_active,
            full_name: user.full_name,
            role: user.role,
            status: user.status,
          },
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Register function
  const register = async (email: string, password: string, full_name?: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      await authService.register({ 
        email, 
        password,
        full_name 
      });
      
      // Auto-login after successful registration
      await login(email, password); // Use email for login since that's what the backend expects
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!state.isAuthenticated) return;
    
    try {
      const user = await authService.getCurrentUser();
      dispatch({
        type: 'SET_USER',
        payload: {
          id: user.id,
          email: user.email,
          is_active: user.is_active,
          full_name: user.full_name,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might need to re-login
      dispatch({ type: 'LOGOUT' });
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    loading: state.isLoading, // Add loading alias
    login,
    logout,
    register,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for advanced usage
export { AuthContext };
