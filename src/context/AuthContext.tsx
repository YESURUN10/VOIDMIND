import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, RolePermission, ROLE_PERMISSIONS } from '../types/index.ts';

interface AuthContextType {
  currentUser: UserProfile;
  permissions: RolePermission;
  allUsers: UserProfile[];
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permissionKey: keyof RolePermission) => boolean;
  isLoading: boolean;
}

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr_analyst_01',
    email: 'analyst@voidmind.internal',
    name: 'Elena Rostova',
    role: 'OPERATIONS_ANALYST',
    title: 'Lead Operations Analyst',
    department: 'Global Supply Chain Operations',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_manager_01',
    email: 'manager@voidmind.internal',
    name: 'Marcus Vance',
    role: 'SUPPLY_CHAIN_MANAGER',
    title: 'Director of Logistics & Planning',
    department: 'Supply Chain Strategy',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_warehouse_01',
    email: 'warehouse@voidmind.internal',
    name: 'David Chen',
    role: 'WAREHOUSE_OPERATOR',
    title: 'Facility Fulfillment Supervisor',
    department: 'Fulfillment & Inventory',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_approver_01',
    email: 'approver@voidmind.internal',
    name: 'Sophia Sterling',
    role: 'PROCUREMENT_APPROVER',
    title: 'VP of Global Procurement',
    department: 'Strategic Sourcing',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_admin_01',
    email: 'admin@voidmind.internal',
    name: 'Alexander Cole',
    role: 'ADMINISTRATOR',
    title: 'Enterprise Systems Administrator',
    department: 'Supply Chain IT & Security',
    createdAt: new Date().toISOString(),
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllUsers(data);
          const found = data.find((u: UserProfile) => u.id === currentUser.id);
          if (found) setCurrentUser(found);
        }
      })
      .catch((err) => console.log('Using offline initial user list:', err));
  }, []);

  const switchUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const switchRole = (role: UserRole) => {
    const user = allUsers.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser({
        ...currentUser,
        role,
        title: `${role.replace(/_/g, ' ')}`,
      });
    }
  };

  const permissions = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.OPERATIONS_ANALYST;

  const hasPermission = (permissionKey: keyof RolePermission): boolean => {
    return !!permissions[permissionKey];
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        permissions,
        allUsers,
        switchUser,
        switchRole,
        hasPermission,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
