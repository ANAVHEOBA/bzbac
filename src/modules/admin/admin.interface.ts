// src/modules/admin/admin.interface.ts
export interface AdminDto {
    email: string;
    password: string;
  }
  
  export interface AdminJwtPayload {
    id: string;
    email: string;
  }