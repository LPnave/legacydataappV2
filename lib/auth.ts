import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  exp: number;
  userID: string;
  email: string;
  role: string;
}

export const auth = {
  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        this.logout();
        return false;
      }
      
      return true;
    } catch {
      this.logout();
      return false;
    }
  },

  // Get current user from token
  getCurrentUser(): JWTPayload | null {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        this.logout();
        return null;
      }
      
      return decoded;
    } catch {
      this.logout();
      return null;
    }
  },

  // Get stored user data
  getUserData(): any {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  // Logout user
  logout(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  // Check if user is PM
  isPM(): boolean {
    return this.hasRole('PM');
  },

  // Check if user is Developer
  isDeveloper(): boolean {
    return this.hasRole('Developer');
  }
}; 