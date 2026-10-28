export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string | null;
  permissions: string[];
}
