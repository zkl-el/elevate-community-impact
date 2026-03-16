export type Tables<Database = any> = {
  profiles: {
    Row: {
      id: string
      phone: string | null
      full_name: string | null
      role: string
      access_token: string | null
      token_expires_at: string | null
    }
  }
  otp_codes: {
    Row: {
      id: string
      phone: string
      otp: string
      expires_at: string
      verified: boolean
      full_name: string | null
      created_at: string
    }
  }
}

export type Profile = Tables['profiles']['Row'];

