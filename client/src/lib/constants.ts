export const USER_ROLES = {
  ADMIN: 'admin',
  BUYER: 'buyer',
  MASTER: 'master',
  CONTRACTOR: 'contractor',
  WORKER: 'worker',
  VIEWER: 'viewer',
} as const;

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  EXECUTION: 'execution',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const;

export const SCHEDULE_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['read', 'write', 'delete', 'manage'],
  [USER_ROLES.BUYER]: ['read', 'write'],
  [USER_ROLES.MASTER]: ['read', 'write'],
  [USER_ROLES.CONTRACTOR]: ['read', 'write'],
  [USER_ROLES.WORKER]: ['read'],
  [USER_ROLES.VIEWER]: ['read'],
} as const;

export const UNITS = [
  'm²',
  'm',
  'm³',
  'unidade',
  'kg',
  'ton',
  'rolo',
  'balde',
  'saco',
  'caixa',
  'peça',
  'litro',
  'galão',
  'metro',
  'conjunto',
] as const;

export const STATUS_COLORS = {
  [PROJECT_STATUS.PLANNING]: 'bg-blue-100 text-blue-800',
  [PROJECT_STATUS.EXECUTION]: 'bg-green-100 text-green-800',
  [PROJECT_STATUS.PAUSED]: 'bg-yellow-100 text-yellow-800',
  [PROJECT_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800',
} as const;

export const SCHEDULE_STATUS_COLORS = {
  [SCHEDULE_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [SCHEDULE_STATUS.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [SCHEDULE_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [SCHEDULE_STATUS.DELAYED]: 'bg-red-100 text-red-800',
} as const;
