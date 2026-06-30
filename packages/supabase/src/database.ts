import type {
  AdminClientProfile,
  ActivityEvent,
  ApplianceType,
  Brand,
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ClientProfile,
  Operation,
  Order,
  PublicTechnicianProfile,
  TechnicianApplianceSpecialty,
  TechnicianBrandSpecialty,
  TechnicianCoverageZone,
  TechnicianDocument,
  TechnicianProfile,
  TechnicianReview,
  User,
  Zone,
} from '@servicienta/types';

type Insertable<TRecord> = {
  [TKey in keyof TRecord]?: TRecord[TKey];
};

type Updatable<TRecord> = {
  [TKey in keyof TRecord]?: TRecord[TKey];
};

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          surname?: string | null;
          role?: User['role'];
          status?: User['status'];
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          surname?: string | null;
          role?: User['role'];
          status?: User['status'];
          deleted_at?: string | null;
          created_at?: string;
        };
      };
      client_profiles: {
        Row: ClientProfile;
        Insert: Insertable<ClientProfile> & { id: string };
        Update: Updatable<
          Omit<ClientProfile, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      orders: {
        Row: Order;
        Insert: Insertable<Order>;
        Update: Updatable<Omit<Order, 'id' | 'client_id' | 'created_at'>>;
      };
      operations: {
        Row: Operation;
        Insert: Insertable<Operation>;
        Update: Updatable<
          Omit<Operation, 'id' | 'order_id' | 'technician_id' | 'created_at'>
        >;
      };
      technician_profiles: {
        Row: TechnicianProfile;
        Insert: Insertable<TechnicianProfile> & { id: string };
        Update: Updatable<Omit<TechnicianProfile, 'id' | 'created_at'>>;
      };
      appliance_types: {
        Row: ApplianceType;
        Insert: Insertable<ApplianceType>;
        Update: Updatable<Omit<ApplianceType, 'id' | 'created_at'>>;
      };
      brands: {
        Row: Brand;
        Insert: Insertable<Brand>;
        Update: Updatable<Omit<Brand, 'id' | 'created_at'>>;
      };
      zones: {
        Row: Zone;
        Insert: Insertable<Zone>;
        Update: Updatable<Omit<Zone, 'id' | 'created_at'>>;
      };
      technician_appliance_specialties: {
        Row: TechnicianApplianceSpecialty;
        Insert: Insertable<TechnicianApplianceSpecialty>;
        Update: Updatable<
          Omit<
            TechnicianApplianceSpecialty,
            'id' | 'technician_id' | 'created_at'
          >
        >;
      };
      technician_brand_specialties: {
        Row: TechnicianBrandSpecialty;
        Insert: Insertable<TechnicianBrandSpecialty>;
        Update: Updatable<
          Omit<TechnicianBrandSpecialty, 'id' | 'technician_id' | 'created_at'>
        >;
      };
      technician_coverage_zones: {
        Row: TechnicianCoverageZone;
        Insert: Insertable<TechnicianCoverageZone>;
        Update: Updatable<
          Omit<TechnicianCoverageZone, 'id' | 'technician_id' | 'created_at'>
        >;
      };
      technician_reviews: {
        Row: TechnicianReview;
        Insert: Insertable<TechnicianReview>;
        Update: Updatable<
          Omit<
            TechnicianReview,
            'id' | 'technician_id' | 'client_id' | 'created_at'
          >
        >;
      };
      technician_documents: {
        Row: TechnicianDocument;
        Insert: Insertable<TechnicianDocument>;
        Update: Updatable<
          Omit<TechnicianDocument, 'id' | 'technician_id' | 'uploaded_at'>
        >;
      };
      activity_events: {
        Row: ActivityEvent;
        Insert: Insertable<ActivityEvent>;
        Update: Updatable<Omit<ActivityEvent, 'id' | 'created_at'>>;
      };
      chat_conversations: {
        Row: ChatConversation;
        Insert: Insertable<ChatConversation>;
        Update: Updatable<
          Omit<ChatConversation, 'id' | 'created_by' | 'created_at'>
        >;
      };
      chat_conversation_participants: {
        Row: ChatParticipant;
        Insert: Insertable<ChatParticipant>;
        Update: Updatable<
          Omit<ChatParticipant, 'conversation_id' | 'user_id' | 'joined_at'>
        >;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Insertable<ChatMessage>;
        Update: Updatable<Omit<ChatMessage, 'id' | 'created_at'>>;
      };
    };
    Views: {
      public_technician_profiles: {
        Row: PublicTechnicianProfile;
      };
      admin_client_profiles: {
        Row: AdminClientProfile;
      };
    };
    Functions: {
      search_public_technician_profiles: {
        Args: {
          _zone_slug: string;
          _appliance_type_slug: string;
          _available?: boolean | null;
        };
        Returns: PublicTechnicianProfile[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
