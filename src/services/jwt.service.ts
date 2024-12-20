import { BaseService } from './base.service';

/**
 * JWT payload interface
 * @interface JwtPayload
 */
interface JwtPayload {
  /** User's unique identifier */
  sub: string;
  /** User's name in English */
  nameEn: string;
  /** User's name in Arabic */
  nameAr: string;
  /** Current status of the user's account */
  accountStatus: string;
  /** User's permission bits */
  permissionBits: string;
  /** Token expiration timestamp */
  exp: number;
  /** Token issued at timestamp */
  iat: number;
}

/**
 * Service for handling JWT token operations
 * Manages token decoding, validation, and payload extraction
 */
export class JwtService extends BaseService {
  /**
   * Decodes a JWT token and extracts the payload
   * @param {string} token - The JWT token to decode
   * @returns {JwtPayload} The decoded payload
   * @throws {Error} If token is invalid
   */
  decodeToken(token: string): JwtPayload {
    try {
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      return payload;
    } catch (error) {
      console.error('Token decode error:', error);
      throw new Error('Invalid token format');
    }
  }

  /**
   * Checks if a token is expired
   * @param {JwtPayload} payload - The decoded token payload
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(payload: JwtPayload): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp <= currentTime;
  }

  /**
   * Gets the current token from the client
   * @returns {string | null} The current token or null
   */
  getCurrentToken(): string | null {
    return this.client.getAccessToken();
  }

  /**
   * Gets the current decoded payload if a valid token exists
   * @returns {JwtPayload | null} The decoded payload or null
   */
  getCurrentPayload(): JwtPayload | null {
    const token = this.getCurrentToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      if (this.isTokenExpired(payload)) return null;
      return payload;
    } catch (error) {
      console.error('Get payload error:', error);
      return null;
    }
  }
} 