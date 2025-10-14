import { AuditEvent } from "../models";
import { SecurityService } from "./SecurityService";
import { Request } from "express";

export enum AuditEventType {
  USER_SIGNUP = "USER_SIGNUP",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  PW_RESET_REQUEST = "PW_RESET_REQUEST",
  PW_RESET_EMAIL_SENT = "PW_RESET_EMAIL_SENT",
  PW_RESET_REDEEMED = "PW_RESET_REDEEMED",
  PW_CHANGED = "PW_CHANGED",
  ADMIN_RESET_INITIATED = "ADMIN_RESET_INITIATED",
  HELP_REQUEST = "HELP_REQUEST",
  USER_ACTIVATED = "USER_ACTIVATED",
  USER_DEACTIVATED = "USER_DEACTIVATED",
  VOUCHER_BOOK_ACCOUNT = "VOUCHER_BOOK_ACCOUNT",
  VOUCHER = "VOUCHER",
  BUDGET_ADJUSTMENT = "BUDGET_ADJUSTMENT",
  FISCAL_YEAR = "FISCAL_YEAR",
  PDF = "PDF",
}

export interface AuditEventData {
  userId?: number;
  actorId?: number;
  eventType: AuditEventType;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, any>;
}

export class AuditService {
  static async logEvent(data: AuditEventData): Promise<void> {
    try {
      await AuditEvent.create({
        userId: data.userId,
        actorId: data.actorId,
        eventType: data.eventType,
        ip: data.ip ? SecurityService.ipToBuffer(data.ip) : undefined,
        userAgent: data.userAgent
          ? data.userAgent.substring(0, 255)
          : undefined,
        meta: data.meta,
        createdAt: new Date(),
      });
    } catch (error) {
      // Log audit failures but don't throw - audit logging should never block the main flow
      console.error("Failed to log audit event:", error);
    }
  }

  static async logFromRequest(
    req: Request,
    eventType: AuditEventType,
    userId?: number,
    actorId?: number,
    meta?: Record<string, any>
  ): Promise<void> {
    const ip = this.extractIP(req);
    const userAgent = req.get("User-Agent");

    await this.logEvent({
      userId,
      actorId,
      eventType,
      ip,
      userAgent,
      meta,
    });
  }

  private static extractIP(req: Request): string {
    // Handle various proxy scenarios
    const forwarded = req.get("X-Forwarded-For");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIP = req.get("X-Real-IP");
    if (realIP) {
      return realIP;
    }

    return req.ip || req.connection.remoteAddress || "unknown";
  }

  static async getAuditTrail(
    userId: number,
    eventTypes?: AuditEventType[],
    limit: number = 50
  ): Promise<AuditEvent[]> {
    const where: any = { user_id: userId };

    if (eventTypes && eventTypes.length > 0) {
      where.event_type = eventTypes;
    }

    return AuditEvent.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
    });
  }
}
