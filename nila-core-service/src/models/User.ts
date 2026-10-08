export interface IUserSchema {
  userId: string;
  mobile?: string;
  email?: string;
  passwordHash?: string;
  fullName?: string;
  relationship?: 'Appa' | 'Amma' | 'Paati' | 'Thatha' | 'Other' | string;
  preferredLanguage?: string;
  preferredDialect?: 'Standard' | 'Chennai' | 'Kongu' | 'Madurai' | string;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
