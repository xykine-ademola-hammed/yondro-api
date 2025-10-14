import AuditLog from '../models/AuditLog';
import { createHash } from 'crypto';

interface AuditData {
  organizationId: number;
  actorId?: number;
  entityType: string;
  entityId: number;
  action: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  static async log(data: AuditData): Promise<void> {
    try {
      // Create hash of the data for integrity
      const hashData = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      const hash = createHash('sha256').update(hashData).digest('hex');

      await AuditLog.create({
        organization_id: data.organizationId,
        actor_id: data.actorId,
        entity_type: data.entityType,
        entity_id: data.entityId,
        action: data.action,
        old_values: data.oldValues,
        new_values: data.newValues,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        hash
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw here to prevent blocking the main operation
    }
  }

  static async getAuditTrail(organizationId: number, entityType?: string, entityId?: number) {
    const where: any = { organization_id: organizationId };
    
    if (entityType) {
      where.entity_type = entityType;
    }
    
    if (entityId) {
      where.entity_id = entityId;
    }

    return await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 1000
    });
  }
}

export default AuditService;