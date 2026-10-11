export interface IUserSchema {
  userId: string;
  mobile?: string;
  email?: string;
  passwordHash?: string;
  fullName?: string;
  relationship?: 'Mother' | 'Father' | 'Grandmother' | 'Grandfather' | 'Guardian' | 'Other' | 'Appa' | 'Amma' | string;
  preferredLanguage?: string;
  preferredDialect?: 'Standard' | 'Chennai' | 'Kongu' | 'Madurai' | string;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
