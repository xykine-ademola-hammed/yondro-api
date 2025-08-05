import { Request, Response } from 'express';
import { BaseService } from '../services/BaseService';
import { Organization, Department } from '../models';

export class OrganizationController {
  private static organizationService = new BaseService(Organization);

  /**
   * POST /organization - Create organization
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({
          error: 'name is required'
        });
        return;
      }

      const organization = await OrganizationController.organizationService.create({
        name,
        description,
        isActive: true
      });

      res.status(201).json({
        success: true,
        data: organization
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to create organization'
      });
    }
  }

  /**
   * GET /organization - Get all organizations with pagination
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search } = req.query;

      const result = await OrganizationController.organizationService.findWithPagination({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        search: search as string,
        include: [
          {
            model: Department,
            as: 'departments',
            attributes: ['id', 'name', 'isActive']
          }
        ]
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get organizations'
      });
    }
  }

  /**
   * GET /organization/:id - Get organization by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: 'Valid organization id is required'
        });
        return;
      }

      const organization = await OrganizationController.organizationService.findById(Number(id), {
        include: [
          {
            model: Department,
            as: 'departments'
          }
        ]
      });

      if (!organization) {
        res.status(404).json({
          error: 'Organization not found'
        });
        return;
      }

      res.json({
        success: true,
        data: organization
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get organization'
      });
    }
  }

  /**
   * PUT /organization/:id - Update organization
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: 'Valid organization id is required'
        });
        return;
      }

      const organization = await OrganizationController.organizationService.update(Number(id), updateData);

      if (!organization) {
        res.status(404).json({
          error: 'Organization not found'
        });
        return;
      }

      res.json({
        success: true,
        data: organization
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to update organization'
      });
    }
  }

  /**
   * DELETE /organization/:id - Delete organization
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: 'Valid organization id is required'
        });
        return;
      }

      const deleted = await OrganizationController.organizationService.delete(Number(id));

      if (!deleted) {
        res.status(404).json({
          error: 'Organization not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to delete organization'
      });
    }
  }
}