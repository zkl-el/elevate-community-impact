export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string | null
          phone: string
          full_name: string
          role: string
          access_token: string | null
          token_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          phone: string
          full_name?: string
          role?: string
          access_token?: string | null
          token_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          phone?: string
          full_name?: string
          role?: string
          access_token?: string | null
          token_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      otp_codes: {
        Row: {
          id: string
          phone: string
          otp: string
          verified: boolean
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          phone: string
          otp: string
          verified?: boolean
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          phone?: string
          otp?: string
          verified?: boolean
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
