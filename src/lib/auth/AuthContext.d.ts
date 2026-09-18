// Type boundary for the JS AuthContext during the JS → TS migration.
// Delete this file when AuthContext.jsx is converted to AuthContext.tsx (Phase 2).

export interface Session {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface AuthContextValue {
  user: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ user: Session }>;
  register: (data: { email: string; password: string; displayName?: string }) => Promise<{ user: Session }>;
  logout: () => void;
}

export declare function AuthProvider(props: { children: React.ReactNode }): JSX.Element;
export declare function useAuth(): AuthContextValue;
