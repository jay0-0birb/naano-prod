export type UserRole = 'saas' | 'influencer' | 'admin';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export type CollaborationStatus = 'active' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaasCompany {
  id: string;
  profile_id: string;
  company_name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
  commission_rate: number | null;
  media_pack_url: string | null;
  conditions: string | null;
  wallet_credits?: number;
  credit_renewal_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  profile_id: string;
  bio: string | null;
  linkedin_url: string | null;
  followers_count: number;
  engagement_rate: number | null;
  expertise_sectors: string[] | null;
  hourly_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  creator_id: string;
  saas_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface Collaboration {
  id: string;
  application_id: string;
  status: CollaborationStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface PublicationProof {
  id: string;
  collaboration_id: string;
  linkedin_post_url: string;
  screenshot_url: string | null;
  submitted_at: string;
  validated: boolean;
  validated_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  collaboration_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Payment {
  id: string;
  collaboration_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

// Extended types with relations
export interface SaasCompanyWithProfile extends SaasCompany {
  profiles: Profile;
}

export interface CreatorProfileWithProfile extends CreatorProfile {
  profiles: Profile;
}

export interface ApplicationWithDetails extends Application {
  creator_profiles: CreatorProfileWithProfile;
  saas_companies: SaasCompanyWithProfile;
}

export interface CollaborationWithDetails extends Collaboration {
  applications: ApplicationWithDetails;
}

