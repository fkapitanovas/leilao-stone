export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          title: string
          make: string
          model: string
          year: number
          mileage: number
          color: string
          description: string | null
          starting_price: number
          current_price: number
          min_bid_increment: number
          images: string[]
          auction_start: string
          auction_end: string
          status: 'scheduled' | 'active' | 'ended' | 'cancelled'
          winner_id: string | null
          final_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          make: string
          model: string
          year: number
          mileage: number
          color: string
          description?: string | null
          starting_price: number
          current_price?: number
          min_bid_increment?: number
          images?: string[]
          auction_start: string
          auction_end: string
          status?: 'scheduled' | 'active' | 'ended' | 'cancelled'
          winner_id?: string | null
          final_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          make?: string
          model?: string
          year?: number
          mileage?: number
          color?: string
          description?: string | null
          starting_price?: number
          current_price?: number
          min_bid_increment?: number
          images?: string[]
          auction_start?: string
          auction_end?: string
          status?: 'scheduled' | 'active' | 'ended' | 'cancelled'
          winner_id?: string | null
          final_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          id: string
          vehicle_id: string
          user_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          user_id?: string
          amount?: number
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'outbid' | 'winner' | 'auction_ended'
          message: string
          vehicle_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'outbid' | 'winner' | 'auction_ended'
          message: string
          vehicle_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'outbid' | 'winner' | 'auction_ended'
          message?: string
          vehicle_id?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      place_bid: {
        Args: {
          p_vehicle_id: string
          p_user_id: string
          p_amount: number
        }
        Returns: Json
      }
      end_auction: {
        Args: {
          p_vehicle_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Bid = Database['public']['Tables']['bids']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type VehicleStatus = Vehicle['status']
export type NotificationType = Notification['type']

export interface BidWithProfile extends Bid {
  profiles: Pick<Profile, 'name' | 'email'> | null
}

export interface VehicleWithBids extends Vehicle {
  bids: BidWithProfile[]
}
