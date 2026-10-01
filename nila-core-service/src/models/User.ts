export interface IUserSchema {
  userId: string;
  mobile?: string;
  email?: string;
  passwordHash?: string;
  fullName: string;
  relationship: 'Appa' | 'Amma' | 'Paati' | 'Thatha' | 'Other';
  preferredLanguage: string; // 'ta'
  preferredDialect: 'Standard' | 'Chennai' | 'Kongu' | 'Madurai';
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
