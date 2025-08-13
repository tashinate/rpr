export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          last_login_at: string | null
          password_hash: string
          session_expires_at: string | null
          session_token: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          password_hash: string
          session_expires_at?: string | null
          session_token?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          password_hash?: string
          session_expires_at?: string | null
          session_token?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          endpoint: string
          id: string
          ip_address: unknown | null
          license_key_id: string | null
          method: string
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_time_ms: number
          status_code: number
          timestamp: string
          user_agent: string | null
          user_session_id: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          method: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms: number
          status_code: number
          timestamp?: string
          user_agent?: string | null
          user_session_id?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          method?: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number
          status_code?: number
          timestamp?: string
          user_agent?: string | null
          user_session_id?: string | null
        }
        Relationships: []
      }
      auth_ciphers: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          last_attempt_at: string | null
          license_key_id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          license_key_id: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          license_key_id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_ciphers_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_operations: {
        Row: {
          cache_type: string
          id: string
          key_name: string
          key_size_bytes: number | null
          license_key_id: string | null
          operation: string
          response_time_ms: number
          timestamp: string
          ttl_seconds: number | null
          user_session_id: string | null
        }
        Insert: {
          cache_type: string
          id?: string
          key_name: string
          key_size_bytes?: number | null
          license_key_id?: string | null
          operation: string
          response_time_ms: number
          timestamp?: string
          ttl_seconds?: number | null
          user_session_id?: string | null
        }
        Update: {
          cache_type?: string
          id?: string
          key_name?: string
          key_size_bytes?: number | null
          license_key_id?: string | null
          operation?: string
          response_time_ms?: number
          timestamp?: string
          ttl_seconds?: number | null
          user_session_id?: string | null
        }
        Relationships: []
      }
      domain_health_monitoring: {
        Row: {
          auto_rotation_enabled: boolean
          blacklist_status: Json
          created_at: string
          domain_name: string
          id: string
          is_healthy: boolean
          last_health_check: string | null
          performance_metrics: Json
          reputation_score: number
          updated_at: string
        }
        Insert: {
          auto_rotation_enabled?: boolean
          blacklist_status?: Json
          created_at?: string
          domain_name: string
          id?: string
          is_healthy?: boolean
          last_health_check?: string | null
          performance_metrics?: Json
          reputation_score?: number
          updated_at?: string
        }
        Update: {
          auto_rotation_enabled?: boolean
          blacklist_status?: Json
          created_at?: string
          domain_name?: string
          id?: string
          is_healthy?: boolean
          last_health_check?: string | null
          performance_metrics?: Json
          reputation_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      domain_rotation_pool: {
        Row: {
          created_at: string
          domain_name: string
          domain_type: string
          id: string
          is_active: boolean
          last_used_at: string | null
          metadata: Json | null
          success_rate: number | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          domain_name: string
          domain_type?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          success_rate?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          domain_name?: string
          domain_type?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          success_rate?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      files: {
        Row: {
          content_type: string
          created_at: string
          disguised_filename: string
          download_count: number
          download_token: string
          file_id: string
          file_path: string
          file_size: number | null
          original_filename: string
          output_filename: string
          updated_at: string
          upload_date: string
          user_id: string | null
        }
        Insert: {
          content_type?: string
          created_at?: string
          disguised_filename: string
          download_count?: number
          download_token?: string
          file_id?: string
          file_path: string
          file_size?: number | null
          original_filename: string
          output_filename?: string
          updated_at?: string
          upload_date?: string
          user_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          disguised_filename?: string
          download_count?: number
          download_token?: string
          file_id?: string
          file_path?: string
          file_size?: number | null
          original_filename?: string
          output_filename?: string
          updated_at?: string
          upload_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      global_system_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_visit_stats: {
        Row: {
          bot_visits: number
          created_at: string
          human_visits: number
          id: string
          total_visits: number
          updated_at: string
          visit_date: string
        }
        Insert: {
          bot_visits?: number
          created_at?: string
          human_visits?: number
          id?: string
          total_visits?: number
          updated_at?: string
          visit_date?: string
        }
        Update: {
          bot_visits?: number
          created_at?: string
          human_visits?: number
          id?: string
          total_visits?: number
          updated_at?: string
          visit_date?: string
        }
        Relationships: []
      }
      license_keys: {
        Row: {
          assigned_user_email: string | null
          created_at: string
          expires_at: string | null
          expiry_preset: string | null
          id: string
          is_active: boolean
          license_key: string
          max_password_generations: number
          metadata: Json | null
          password_generation_count: number
          status: Database["public"]["Enums"]["license_status"]
        }
        Insert: {
          assigned_user_email?: string | null
          created_at?: string
          expires_at?: string | null
          expiry_preset?: string | null
          id?: string
          is_active?: boolean
          license_key: string
          max_password_generations?: number
          metadata?: Json | null
          password_generation_count?: number
          status?: Database["public"]["Enums"]["license_status"]
        }
        Update: {
          assigned_user_email?: string | null
          created_at?: string
          expires_at?: string | null
          expiry_preset?: string | null
          id?: string
          is_active?: boolean
          license_key?: string
          max_password_generations?: number
          metadata?: Json | null
          password_generation_count?: number
          status?: Database["public"]["Enums"]["license_status"]
        }
        Relationships: []
      }
      manual_decisions: {
        Row: {
          created_at: string
          decision: string
          decision_key: string
          expires_at: string
          id: string
          license_key_id: string
          session_token: string
          updated_at: string
          visitor_data: Json
        }
        Insert: {
          created_at?: string
          decision?: string
          decision_key: string
          expires_at?: string
          id?: string
          license_key_id: string
          session_token: string
          updated_at?: string
          visitor_data?: Json
        }
        Update: {
          created_at?: string
          decision?: string
          decision_key?: string
          expires_at?: string
          id?: string
          license_key_id?: string
          session_token?: string
          updated_at?: string
          visitor_data?: Json
        }
        Relationships: []
      }
      operational_logs: {
        Row: {
          created_at: string
          id: string
          license_key_id: string | null
          operation_details: Json | null
          operation_message: string
          operation_type: string
          severity: string
          updated_at: string
          user_session_token: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          license_key_id?: string | null
          operation_details?: Json | null
          operation_message: string
          operation_type: string
          severity?: string
          updated_at?: string
          user_session_token?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          license_key_id?: string | null
          operation_details?: Json | null
          operation_message?: string
          operation_type?: string
          severity?: string
          updated_at?: string
          user_session_token?: string | null
        }
        Relationships: []
      }
      pattern_usage: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          license_key_id: string | null
          pattern_id: string | null
          success_rate: number
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          license_key_id?: string | null
          pattern_id?: string | null
          success_rate?: number
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          license_key_id?: string | null
          pattern_id?: string | null
          success_rate?: number
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pattern_usage_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "url_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limiting_events: {
        Row: {
          blocked: boolean
          current_count: number
          event_type: string
          id: string
          ip_address: unknown | null
          license_key_id: string | null
          limit_threshold: number
          operation: string
          reset_time: string | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          blocked?: boolean
          current_count: number
          event_type: string
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          limit_threshold: number
          operation: string
          reset_time?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          blocked?: boolean
          current_count?: number
          event_type?: string
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          limit_threshold?: number
          operation?: string
          reset_time?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limiting_events_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      script_downloads: {
        Row: {
          category: string | null
          description: string | null
          display_name: string
          download_count: number
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string
          upload_date: string
          version: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          display_name: string
          download_count?: number
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
          upload_date?: string
          version?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          display_name?: string
          download_count?: number
          file_path?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
          upload_date?: string
          version?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string | null
          event_details: Json | null
          event_message: string
          event_type: string
          id: string
          ip_address: unknown | null
          license_key_id: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_message: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_message?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_error_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          error_message: string
          error_type: string
          id: string
          license_key_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_status: boolean
          severity: string
          updated_at: string
          user_session_token: string | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          error_message: string
          error_type: string
          id?: string
          license_key_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_status?: boolean
          severity?: string
          updated_at?: string
          user_session_token?: string | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          license_key_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_status?: boolean
          severity?: string
          updated_at?: string
          user_session_token?: string | null
        }
        Relationships: []
      }
      system_performance_logs: {
        Row: {
          cpu_usage_percent: number | null
          error_message: string | null
          id: string
          license_key_id: string | null
          memory_usage_mb: number | null
          operation_type: string
          response_time_ms: number
          success: boolean
          timestamp: string
          user_session_id: string | null
        }
        Insert: {
          cpu_usage_percent?: number | null
          error_message?: string | null
          id?: string
          license_key_id?: string | null
          memory_usage_mb?: number | null
          operation_type: string
          response_time_ms: number
          success?: boolean
          timestamp?: string
          user_session_id?: string | null
        }
        Update: {
          cpu_usage_percent?: number | null
          error_message?: string | null
          id?: string
          license_key_id?: string | null
          memory_usage_mb?: number | null
          operation_type?: string
          response_time_ms?: number
          success?: boolean
          timestamp?: string
          user_session_id?: string | null
        }
        Relationships: []
      }
      url_patterns: {
        Row: {
          base_success_rate: number
          category: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          pattern_name: string
          template: string
          tier: number
          updated_at: string
          usage_limits: Json
        }
        Insert: {
          base_success_rate?: number
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          pattern_name: string
          template: string
          tier?: number
          updated_at?: string
          usage_limits?: Json
        }
        Update: {
          base_success_rate?: number
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          pattern_name?: string
          template?: string
          tier?: number
          updated_at?: string
          usage_limits?: Json
        }
        Relationships: []
      }
      url_registry: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          is_active: boolean
          license_key_id: string
          pattern_id: string | null
          pattern_name: string | null
          redirect_url: string | null
          updated_at: string
          url_hash: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          license_key_id: string
          pattern_id?: string | null
          pattern_name?: string | null
          redirect_url?: string | null
          updated_at?: string
          url_hash: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          license_key_id?: string
          pattern_id?: string | null
          pattern_name?: string | null
          redirect_url?: string | null
          updated_at?: string
          url_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "url_registry_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "url_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_licenses: {
        Row: {
          created_at: string
          id: string
          license_key_id: string
          updated_at: string
          user_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          license_key_id: string
          updated_at?: string
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          license_key_id?: string
          updated_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_licenses_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: true
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_script_downloads: {
        Row: {
          download_date: string
          download_success: boolean
          id: string
          ip_address: string | null
          license_key_id: string
          metadata: Json | null
          script_id: string
          user_agent: string | null
        }
        Insert: {
          download_date?: string
          download_success?: boolean
          id?: string
          ip_address?: string | null
          license_key_id: string
          metadata?: Json | null
          script_id: string
          user_agent?: string | null
        }
        Update: {
          download_date?: string
          download_success?: boolean
          id?: string
          ip_address?: string | null
          license_key_id?: string
          metadata?: Json | null
          script_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          license_key_id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          license_key_id: string
          session_token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          license_key_id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_telegram_configs: {
        Row: {
          bot_token: string
          chat_id: string
          created_at: string
          id: string
          license_key_id: string
          notification_settings: Json
          updated_at: string
        }
        Insert: {
          bot_token: string
          chat_id: string
          created_at?: string
          id?: string
          license_key_id: string
          notification_settings?: Json
          updated_at?: string
        }
        Update: {
          bot_token?: string
          chat_id?: string
          created_at?: string
          id?: string
          license_key_id?: string
          notification_settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_telegram_configs_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: true
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_visit_stats: {
        Row: {
          bot_visits: number
          created_at: string
          human_visits: number
          id: string
          license_key_id: string
          total_visits: number
          updated_at: string
          visit_date: string
        }
        Insert: {
          bot_visits?: number
          created_at?: string
          human_visits?: number
          id?: string
          license_key_id: string
          total_visits?: number
          updated_at?: string
          visit_date?: string
        }
        Update: {
          bot_visits?: number
          created_at?: string
          human_visits?: number
          id?: string
          license_key_id?: string
          total_visits?: number
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_visit_stats_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_logs: {
        Row: {
          action_taken: string | null
          bot_confidence: number | null
          browser: string | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string
          is_bot: boolean
          isp: string | null
          license_key_id: string
          os: string | null
          page_views: number | null
          redirect_url: string | null
          referrer: string | null
          region: string | null
          session_token: string | null
          timezone: string | null
          updated_at: string
          url_hash: string | null
          user_agent: string | null
          visit_duration: number | null
        }
        Insert: {
          action_taken?: string | null
          bot_confidence?: number | null
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address: string
          is_bot?: boolean
          isp?: string | null
          license_key_id: string
          os?: string | null
          page_views?: number | null
          redirect_url?: string | null
          referrer?: string | null
          region?: string | null
          session_token?: string | null
          timezone?: string | null
          updated_at?: string
          url_hash?: string | null
          user_agent?: string | null
          visit_duration?: number | null
        }
        Update: {
          action_taken?: string | null
          bot_confidence?: number | null
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string
          is_bot?: boolean
          isp?: string | null
          license_key_id?: string
          os?: string | null
          page_views?: number | null
          redirect_url?: string | null
          referrer?: string | null
          region?: string | null
          session_token?: string | null
          timezone?: string | null
          updated_at?: string
          url_hash?: string | null
          user_agent?: string | null
          visit_duration?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_admin: {
        Args: { username_input: string; password_input: string }
        Returns: Json
      }
      authenticate_user_session: {
        Args: { password_input: string }
        Returns: Json
      }
      auto_cleanup_expired_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      backfill_user_visit_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      bulk_delete_errors: {
        Args: { error_ids: string[] }
        Returns: Json
      }
      bulk_delete_licenses: {
        Args: { license_ids: string[] }
        Returns: Json
      }
      bulk_resolve_errors: {
        Args: { error_ids: string[]; resolved_by_input: string }
        Returns: Json
      }
      bulk_toggle_license_status: {
        Args: {
          license_ids: string[]
          new_status: Database["public"]["Enums"]["license_status"]
        }
        Returns: Json
      }
      check_auth_cooldown: {
        Args: { license_key_input: string }
        Returns: Json
      }
      check_generation_status: {
        Args: { license_key_input: string }
        Returns: Json
      }
      cleanup_existing_spam_logs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_expired_licenses: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_manual_decisions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_obsolete_errors: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_old_analytics_logs: {
        Args: { retention_days?: number }
        Returns: Json
      }
      cleanup_orphaned_sessions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_system_error_logs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_user_sessions: {
        Args: { days_old?: number }
        Returns: Json
      }
      cleanup_visit_stats: {
        Args: { days_old?: number }
        Returns: Json
      }
      comprehensive_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_auth_cipher: {
        Args: { license_key_input: string; password_hash_input: string }
        Returns: Json
      }
      create_auth_cipher_enhanced: {
        Args: { license_key_input: string; password_hash_input: string }
        Returns: Json
      }
      create_user_session: {
        Args: { key_input: string }
        Returns: Json
      }
      create_user_session_enhanced: {
        Args: { key_input: string; user_email_input?: string }
        Returns: Json
      }
      deactivate_urls_for_license: {
        Args: { license_id: string }
        Returns: Json
      }
      decrypt_bot_token: {
        Args: { encrypted_token: string }
        Returns: string
      }
      decrypt_bot_token_secure: {
        Args: { encrypted_token: string; license_key_id: string }
        Returns: string
      }
      delete_user_telegram_config: {
        Args: { session_token_input: string }
        Returns: Json
      }
      encrypt_bot_token: {
        Args: { token_text: string }
        Returns: string
      }
      encrypt_bot_token_secure: {
        Args: { token_text: string; license_key_id: string }
        Returns: string
      }
      generate_license_with_preset: {
        Args: { preset: string; user_email_input?: string }
        Returns: Json
      }
      get_current_license_key_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_pattern_metrics: {
        Args: { limit_input?: number }
        Returns: {
          pattern_id: string
          pattern_name: string
          success_rate: number
          usage_count: number
          last_used_at: string
        }[]
      }
      get_error_analytics: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_global_system_config: {
        Args: { key_input: string }
        Returns: Json
      }
      get_intelligent_patterns: {
        Args: {
          category_filter?: string
          tier_filter?: number
          limit_input?: number
        }
        Returns: {
          id: string
          pattern_name: string
          category: string
          tier: number
          base_success_rate: number
          template: string
          metadata: Json
          usage_limits: Json
        }[]
      }
      get_license_from_url: {
        Args: { url_hash_input: string }
        Returns: {
          license_key_id: string
          pattern_name: string
          redirect_url: string
        }[]
      }
      get_manual_decisions_for_session: {
        Args: { session_token_input: string }
        Returns: {
          id: string
          decision_key: string
          decision: string
          visitor_data: Json
          created_at: string
          expires_at: string
          license_key_id: string
          session_token: string
          updated_at: string
        }[]
      }
      get_rate_limiting_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_real_analytics_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_real_cache_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_real_pattern_performance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_real_rate_limiting_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_real_system_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_rotating_domain: {
        Args: { category_input?: string }
        Returns: {
          domain_name: string
          domain_type: string
          success_rate: number
        }[]
      }
      get_script_download_stats: {
        Args: { days_back?: number }
        Returns: {
          script_id: string
          script_name: string
          total_downloads: number
          recent_downloads: number
          unique_users: number
        }[]
      }
      get_system_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_system_setting: {
        Args: { setting_name: string }
        Returns: boolean
      }
      get_user_telegram_config: {
        Args: { session_token_input: string }
        Returns: {
          bot_token: string
          chat_id: string
          notification_settings: Json
        }[]
      }
      has_valid_telegram_config: {
        Args: { license_key_id_input: string }
        Returns: boolean
      }
      increment_ai_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_failed_attempts: {
        Args: { license_key_input: string }
        Returns: Json
      }
      increment_global_visit_stats: {
        Args: { is_bot?: boolean }
        Returns: Json
      }
      increment_user_visit_stats: {
        Args: { session_token_input: string; is_bot?: boolean }
        Returns: Json
      }
      increment_user_visit_stats_enhanced: {
        Args: { license_key_id_input: string; is_bot?: boolean }
        Returns: Json
      }
      log_api_request: {
        Args: {
          p_endpoint: string
          p_method: string
          p_status_code: number
          p_response_time_ms: number
          p_request_size_bytes?: number
          p_response_size_bytes?: number
          p_user_agent?: string
          p_ip_address?: unknown
          p_user_session_id?: string
          p_license_key_id?: string
        }
        Returns: string
      }
      log_cache_operation: {
        Args: {
          p_cache_type: string
          p_operation: string
          p_key_name: string
          p_response_time_ms: number
          p_key_size_bytes?: number
          p_ttl_seconds?: number
          p_user_session_id?: string
          p_license_key_id?: string
        }
        Returns: string
      }
      log_operational_event: {
        Args: {
          operation_type_input: string
          operation_message_input: string
          operation_details_input?: Json
          user_session_token_input?: string
          severity_input?: string
        }
        Returns: Json
      }
      log_pattern_usage: {
        Args: {
          p_pattern_id: string
          p_success?: boolean
          p_response_time_ms?: number
          p_generated_urls_count?: number
          p_error_message?: string
          p_user_session_id?: string
          p_license_key_id?: string
        }
        Returns: string
      }
      log_rate_limiting_event: {
        Args: {
          p_license_key_id: string
          p_event_type: string
          p_operation: string
          p_current_count: number
          p_limit_threshold: number
          p_reset_time?: string
          p_blocked?: boolean
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      log_script_download: {
        Args: {
          script_id_input: string
          license_key_id_input: string
          ip_address_input?: string
          user_agent_input?: string
        }
        Returns: Json
      }
      log_security_event: {
        Args: {
          event_type_input: string
          event_message_input: string
          user_id_input?: string
          license_key_id_input?: string
          ip_address_input?: unknown
          user_agent_input?: string
          event_details_input?: Json
          severity_input?: string
        }
        Returns: string
      }
      log_system_error: {
        Args: {
          error_type_input: string
          error_message_input: string
          error_details_input?: Json
          user_session_token_input?: string
          severity_input?: string
        }
        Returns: Json
      }
      log_system_error_enhanced: {
        Args: {
          error_type_input: string
          error_message_input: string
          error_details_input?: Json
          user_session_token_input?: string
          severity_input?: string
          skip_if_configuration?: boolean
        }
        Returns: Json
      }
      log_system_performance: {
        Args: {
          p_operation_type: string
          p_response_time_ms: number
          p_memory_usage_mb?: number
          p_cpu_usage_percent?: number
          p_success?: boolean
          p_error_message?: string
          p_user_session_id?: string
          p_license_key_id?: string
        }
        Returns: string
      }
      log_url_generation: {
        Args: {
          p_pattern_id?: string
          p_license_key_id?: string
          p_generated_count?: number
          p_processing_time_ms?: number
          p_cache_hit?: boolean
          p_success?: boolean
          p_error_details?: string
          p_user_session_id?: string
        }
        Returns: string
      }
      log_visit: {
        Args: {
          license_key_id_input: string
          ip_address_input: string
          session_token_input?: string
          url_hash_input?: string
          country_code_input?: string
          country_name_input?: string
          city_input?: string
          region_input?: string
          timezone_input?: string
          isp_input?: string
          user_agent_input?: string
          browser_input?: string
          device_type_input?: string
          os_input?: string
          referrer_input?: string
          is_bot_input?: boolean
          bot_confidence_input?: number
          action_taken_input?: string
          redirect_url_input?: string
        }
        Returns: Json
      }
      logout_admin: {
        Args: { session_token_input: string }
        Returns: Json
      }
      reactivate_urls_for_license: {
        Args: { license_id: string }
        Returns: Json
      }
      register_generated_url: {
        Args: {
          url_hash_input: string
          license_key_id_input: string
          pattern_name_input: string
          redirect_url_input: string
          expiry_hours?: number
        }
        Returns: Json
      }
      reset_auth_cipher: {
        Args: { license_key_input: string; new_password_hash_input: string }
        Returns: Json
      }
      reset_auth_cipher_with_limits: {
        Args: { license_key_input: string; new_password_hash_input: string }
        Returns: Json
      }
      reset_telegram_configs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      resolve_system_error: {
        Args: { error_id_input: string; resolved_by_input: string }
        Returns: Json
      }
      set_global_system_config: {
        Args: { key_input: string; value_input: Json }
        Returns: Json
      }
      system_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_hash_consistency: {
        Args: { test_url: string; test_license_id: string }
        Returns: Json
      }
      toggle_license_status: {
        Args: {
          license_id: string
          new_status: Database["public"]["Enums"]["license_status"]
        }
        Returns: Json
      }
      update_domain_health_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_notification_settings: {
        Args: { session_token_input: string; notification_settings_input: Json }
        Returns: Json
      }
      upsert_user_telegram_config: {
        Args: {
          session_token_input: string
          bot_token_input: string
          chat_id_input: string
          notification_settings_input?: Json
        }
        Returns: Json
      }
      validate_admin_session: {
        Args:
          | { session_token_input: string }
          | { username_input: string; session_token_input: string }
        Returns: boolean
      }
      validate_auth_cipher: {
        Args: { password_hash_input: string }
        Returns: Json
      }
      validate_auth_cipher_enhanced: {
        Args: { password_hash_input: string }
        Returns: Json
      }
      validate_license_key: {
        Args: { key_input: string }
        Returns: Json
      }
      validate_license_key_enhanced: {
        Args: { key_input: string }
        Returns: Json
      }
      validate_session_with_license: {
        Args: { session_token_input: string }
        Returns: Json
      }
    }
    Enums: {
      license_status: "active" | "paused" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      license_status: ["active", "paused", "expired"],
    },
  },
} as const
