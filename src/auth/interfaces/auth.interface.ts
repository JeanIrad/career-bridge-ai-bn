export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  token?: string;
}

export interface ClerkUser {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
    id: string;
  }>;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
  updatedAt: number;
}
