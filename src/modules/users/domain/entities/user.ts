export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  // roleId: number;
  createdAt: Date;
  updatedAt: Date;
}
