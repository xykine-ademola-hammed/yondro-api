import crypto from "crypto";
import axios from "axios";

export class SecurityService {
  // Generate cryptographically secure random token
  static generateToken(byteLength: number = 32): string {
    return crypto.randomBytes(byteLength).toString("base64url");
  }

  // Hash token using SHA-256
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  // Generate nonce for cookie binding
  static generateNonce(byteLength: number = 16): string {
    return crypto.randomBytes(byteLength).toString("base64url");
  }

  // Convert IP address to buffer for storage
  static ipToBuffer(ip: string): Buffer | null {
    try {
      // Handle IPv4 and IPv6
      if (ip.includes(":")) {
        // IPv6
        const parts = ip.split(":");
        const buffer = Buffer.alloc(16);
        let offset = 0;
        for (const part of parts) {
          if (part) {
            const value = parseInt(part, 16);
            buffer.writeUInt16BE(value, offset);
            offset += 2;
          }
        }
        return buffer;
      } else {
        // IPv4
        const parts = ip.split(".").map(Number);
        if (parts.length === 4 && parts.every((p) => p >= 0 && p <= 255)) {
          return Buffer.from(parts);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Check password against breach database using k-anonymity
  static async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      const hash = crypto
        .createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Use HIBP API with k-anonymity
      const response = await axios.get(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          timeout: 5000,
          headers: {
            "User-Agent": "PasswordResetService/1.0",
            ...(process.env.HIBP_API_KEY && {
              "hibp-api-key": process.env.HIBP_API_KEY,
            }),
          },
        }
      );

      const hashes = response.data.split("\n");
      return hashes.some((line: string) => {
        const [hashSuffix] = line.split(":");
        return hashSuffix === suffix;
      });
    } catch (error) {
      // If breach check fails, log error but don't block password change
      console.error("Breach check failed:", error);
      return false;
    }
  }

  // Add random delay to prevent timing attacks
  static async addJitter(
    minMs: number = 200,
    maxMs: number = 500
  ): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (!password || password.length < 12) {
      return {
        valid: false,
        message: "Password must be at least 12 characters long.",
      };
    }

    // Additional checks can be added here
    // For now, we rely primarily on breach checking
    return { valid: true };
  }

  // Generate secure cookie value
  static generateCookieValue(resetId?: number, nonce?: string): string {
    const nonceToUse = nonce || this.generateNonce();
    return `${resetId}.${nonceToUse}`;
  }

  // Parse cookie value
  static parseCookieValue(
    cookieValue: string
  ): { resetId: number; nonce: string } | null {
    try {
      const [resetIdStr, nonce] = cookieValue.split(".");
      const resetId = parseInt(resetIdStr, 10);

      if (isNaN(resetId) || !nonce) {
        return null;
      }

      return { resetId, nonce };
    } catch {
      return null;
    }
  }
}
