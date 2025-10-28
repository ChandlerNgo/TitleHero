import React from 'react';

// Types for authentication
export type UserRole = 'admin' | 'user';

interface AuthData {
    token: string | null;
    role: UserRole | null;
    username: string | null;
}

// Get current auth data
export const getAuthData = (): AuthData => ({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role') as UserRole,
    username: localStorage.getItem('username')
});

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    const { token } = getAuthData();
    return !!token;
};

// Check if user is an admin
export const isAdmin = (): boolean => {
    const { role } = getAuthData();
    return role === 'admin';
};

// Clear all auth data (logout)
export const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = '/login';
};

// Higher-order function to protect routes
export const requireAuth = <P extends object>(Component: React.ComponentType<P>) => {
    return function ProtectedRoute(props: P) {
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return null;
        }
        return React.createElement(Component, props);
    };
};

// Higher-order function to protect admin routes
export const requireAdmin = <P extends object>(Component: React.ComponentType<P>) => {
    return function AdminRoute(props: P) {
        if (!isAuthenticated() || !isAdmin()) {
            window.location.href = '/dashboard'; // Redirect non-admins to regular dashboard
            return null;
        }
        return React.createElement(Component, props);
    };
};