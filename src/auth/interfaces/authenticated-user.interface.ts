import { Role } from '../enums/role.enum.js';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  sessionId?: string;
}
