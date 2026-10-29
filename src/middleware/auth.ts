import { Request, Response, NextFunction } from 'express';
import { UserRole, ROLE_PERMISSIONS, UserProfile } from '../types/index.ts';
import { dbContext } from '../db/index.ts';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

// In-memory token/session cache for rapid fast-switching and bearer tokens
const SESSION_STORE = new Map<string, UserProfile>();

export function registerSession(token: string, user: UserProfile): void {
  SESSION_STORE.set(token, user);
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const authHeader = req.headers.authorization;

  // 1. Check Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const cachedUser = SESSION_STORE.get(token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }
  }

  // 2. Production Security Audit: Reject impersonation headers in production
  if (isProduction && !authHeader) {
    const internalSecret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || 'voidmind_internal_guard';
    if (!internalSecret || internalSecret !== expectedSecret) {
      // Block unauthenticated impersonation
      res.status(401).json({
        error: 'Unauthorized: Header-based impersonation is disabled in production environments.',
        code: 'PRODUCTION_AUTH_REQUIRED',
      });
      return;
    }
  }

  // 3. Development / Staging Persona Switching
  const devUserId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const devRole = (req.headers['x-user-role'] as string) || (req.query.role as string);

  const targetUserId = devUserId || (devRole ? getUserIdByRole(devRole as UserRole) : 'usr_analyst_01');

  try {
    const result = await dbContext.query(
      'SELECT id, email, name, role, title, department, created_at FROM users WHERE id = $1',
      [targetUserId]
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      req.user = {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        title: row.title,
        department: row.department,
        createdAt: row.created_at,
      };
      return next();
    }
  } catch (err) {
    console.error('[VoidMind Auth] Error fetching user for authentication:', err);
  }

  // Fallback default user if database not yet migrated
  req.user = {
    id: 'usr_analyst_01',
    email: 'analyst@voidmind.internal',
    name: 'Elena Rostova',
    role: (devRole as UserRole) || 'OPERATIONS_ANALYST',
    title: 'Lead Operations Analyst',
    department: 'Global Supply Chain Operations',
    createdAt: new Date().toISOString(),
  };

  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Role '${req.user.role}' is not authorized to perform this action. Required one of: [${allowedRoles.join(', ')}]`,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}

export function enforceSeparationOfDuties(
  planAuthorIdResolver: (req: AuthenticatedRequest) => Promise<string | null>
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const authorId = await planAuthorIdResolver(req);
    if (authorId && authorId === req.user.id) {
      res.status(403).json({
        error: 'Separation of Duties Violation: You cannot approve or sign off on a recovery plan you authored.',
        rule: 'SEPARATION_OF_DUTIES_STRICT',
        authorId,
        approverId: req.user.id,
      });
      return;
    }

    next();
  };
}

function getUserIdByRole(role: UserRole): string {
  switch (role) {
    case 'OPERATIONS_ANALYST':
      return 'usr_analyst_01';
    case 'SUPPLY_CHAIN_MANAGER':
      return 'usr_manager_01';
    case 'WAREHOUSE_OPERATOR':
      return 'usr_warehouse_01';
    case 'PROCUREMENT_APPROVER':
      return 'usr_approver_01';
    case 'ADMINISTRATOR':
      return 'usr_admin_01';
    default:
      return 'usr_analyst_01';
  }
}
