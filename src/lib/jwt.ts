import Cookies from 'js-cookie';

interface JWTPayload {
  sub: string;
  email: string;
  nameEn: string;
  nameAr: string;
  permissions: number;
  iat: number;
  exp: number;
}

export const jwt = {
  /**
   * Decode base64 string in browser environment
   */
  private base64Decode(str: string): string {
    // Replace non-url compatible chars with base64 standard chars
    const input = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add removed padding
    const pad = input.length % 4;
    if (pad) {
      input += new Array(5 - pad).join('=');
    }
    
    try {
      return decodeURIComponent(
        atob(input)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      console.error('Error decoding base64:', e);
      return '';
    }
  },

  /**
   * Decode the JWT token from cookies
   */
  getDecodedToken(): JWTPayload | null {
    try {
      const token = Cookies.get('accessToken');
      if (!token) return null;
      
      const base64Payload = token.split('.')[1];
      if (!base64Payload) return null;

      const jsonPayload = this.base64Decode(base64Payload);
      return jsonPayload ? JSON.parse(jsonPayload) : null;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  },

  /**
   * Check if user has specific permission using bitwise operation
   */
  hasPermission(permission: number): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return false;
    return (decoded.permissions & permission) === permission;
  },

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: number[]): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return false;
    return permissions.some(permission => 
      (decoded.permissions & permission) === permission
    );
  },

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: number[]): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return false;
    return permissions.every(permission => 
      (decoded.permissions & permission) === permission
    );
  },

  /**
   * Get user information from token
   */
  getUserInfo() {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;
    
    return {
      id: decoded.sub,
      email: decoded.email,
      nameEn: decoded.nameEn,
      nameAr: decoded.nameAr,
      permissions: decoded.permissions,
    };
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
  }
}; 