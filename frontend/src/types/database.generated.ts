export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      activity_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          topic_id: string | null
          topic_title: string | null
          type: Database["public"]["Enums"]["activity_type"]
          workspace_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          topic_id?: string | null
          topic_title?: string | null
          type: Database["public"]["Enums"]["activity_type"]
          workspace_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          topic_id?: string | null
          topic_title?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_revision_requests: {
        Row: {
          brief_id: string
          completed_at: string | null
          created_at: string
          id: string
          request: string
          requested_by: string | null
          status: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Insert: {
          brief_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          request: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Update: {
          brief_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          request?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_revision_requests_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_briefs: {
        Row: {
          angle: string | null
          approved_at: string | null
          approved_by: string | null
          cited_claims: number
          created_at: string
          draft: string | null
          evidence_map: Json
          id: string
          key_facts: Json
          key_questions: Json
          must_avoid: Json
          must_cover: Json
          objective: string | null
          outline: Json
          quality_checks: Json
          quality_warnings: Json
          review_status: Database["public"]["Enums"]["brief_status"]
          search_intent: string | null
          sources_used: number
          target_audience: string | null
          title: string
          topic_id: string
          total_claims: number
          updated_at: string
          version: number
          word_count: number
          workspace_id: string
        }
        Insert: {
          angle?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cited_claims?: number
          created_at?: string
          draft?: string | null
          evidence_map?: Json
          id?: string
          key_facts?: Json
          key_questions?: Json
          must_avoid?: Json
          must_cover?: Json
          objective?: string | null
          outline?: Json
          quality_checks?: Json
          quality_warnings?: Json
          review_status?: Database["public"]["Enums"]["brief_status"]
          search_intent?: string | null
          sources_used?: number
          target_audience?: string | null
          title: string
          topic_id: string
          total_claims?: number
          updated_at?: string
          version?: number
          word_count?: number
          workspace_id: string
        }
        Update: {
          angle?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cited_claims?: number
          created_at?: string
          draft?: string | null
          evidence_map?: Json
          id?: string
          key_facts?: Json
          key_questions?: Json
          must_avoid?: Json
          must_cover?: Json
          objective?: string | null
          outline?: Json
          quality_checks?: Json
          quality_warnings?: Json
          review_status?: Database["public"]["Enums"]["brief_status"]
          search_intent?: string | null
          sources_used?: number
          target_audience?: string | null
          title?: string
          topic_id?: string
          total_claims?: number
          updated_at?: string
          version?: number
          word_count?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_briefs_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      discovered_topics: {
        Row: {
          added_to_queue_at: string | null
          angle: string | null
          business_relevance: Json
          content_gap: Json
          created_at: string
          discovery_run_id: string | null
          id: string
          opportunity_score: number
          priority: Database["public"]["Enums"]["priority_level"]
          reasoning: string | null
          search_signals: Json
          title: string
          topic_id: string | null
          workspace_id: string
        }
        Insert: {
          added_to_queue_at?: string | null
          angle?: string | null
          business_relevance?: Json
          content_gap?: Json
          created_at?: string
          discovery_run_id?: string | null
          id?: string
          opportunity_score: number
          priority: Database["public"]["Enums"]["priority_level"]
          reasoning?: string | null
          search_signals?: Json
          title: string
          topic_id?: string | null
          workspace_id: string
        }
        Update: {
          added_to_queue_at?: string | null
          angle?: string | null
          business_relevance?: Json
          content_gap?: Json
          created_at?: string
          discovery_run_id?: string | null
          id?: string
          opportunity_score?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          reasoning?: string | null
          search_signals?: Json
          title?: string
          topic_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovered_topics_discovery_run_id_fkey"
            columns: ["discovery_run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_topics_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "discovered_topics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_runs: {
        Row: {
          auto_add: boolean
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          market: string | null
          period: string | null
          result_count: number
          status: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Insert: {
          auto_add?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          market?: string | null
          period?: string | null
          result_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Update: {
          auto_add?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          market?: string | null
          period?: string | null
          result_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_sources: {
        Row: {
          finding_id: string
          source_id: string
          workspace_id: string
        }
        Insert: {
          finding_id: string
          source_id: string
          workspace_id: string
        }
        Update: {
          finding_id?: string
          source_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finding_sources_finding_id_workspace_id_fkey"
            columns: ["finding_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "finding_sources_source_id_workspace_id_fkey"
            columns: ["source_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      findings: {
        Row: {
          claim: string
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          id: string
          topic_id: string
          workspace_id: string
        }
        Insert: {
          claim: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          id?: string
          topic_id: string
          workspace_id: string
        }
        Update: {
          claim?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          id?: string
          topic_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      information_gaps: {
        Row: {
          created_at: string
          description: string | null
          evidence: string | null
          id: string
          importance: Database["public"]["Enums"]["priority_level"]
          title: string
          topic_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence?: string | null
          id?: string
          importance?: Database["public"]["Enums"]["priority_level"]
          title: string
          topic_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence?: string | null
          id?: string
          importance?: Database["public"]["Enums"]["priority_level"]
          title?: string
          topic_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "information_gaps_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      opportunities: {
        Row: {
          angle: string | null
          audience: string | null
          breakdown: Json
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          reasons: Json
          recommendation: string | null
          score: number
          topic_id: string
          workspace_id: string
        }
        Insert: {
          angle?: string | null
          audience?: string | null
          breakdown?: Json
          created_at?: string
          id?: string
          priority: Database["public"]["Enums"]["priority_level"]
          reasons?: Json
          recommendation?: string | null
          score: number
          topic_id: string
          workspace_id: string
        }
        Update: {
          angle?: string | null
          audience?: string | null
          breakdown?: Json
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          reasons?: Json
          recommendation?: string | null
          score?: number
          topic_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_plans: {
        Row: {
          approach: string | null
          created_at: string
          id: string
          objective: string
          questions: Json
          topic_id: string
          workspace_id: string
        }
        Insert: {
          approach?: string | null
          created_at?: string
          id?: string
          objective: string
          questions?: Json
          topic_id: string
          workspace_id: string
        }
        Update: {
          approach?: string | null
          created_at?: string
          id?: string
          objective?: string
          questions?: Json
          topic_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_plans_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      search_queries: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number
          status: Database["public"]["Enums"]["job_status"]
          topic_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          topic_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          topic_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          domain: string | null
          extracted_info: string | null
          id: string
          published_date: string | null
          relevance: number
          title: string
          topic_id: string
          type: Database["public"]["Enums"]["source_type"]
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          extracted_info?: string | null
          id?: string
          published_date?: string | null
          relevance?: number
          title: string
          topic_id: string
          type: Database["public"]["Enums"]["source_type"]
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          extracted_info?: string | null
          id?: string
          published_date?: string | null
          relevance?: number
          title?: string
          topic_id?: string
          type?: Database["public"]["Enums"]["source_type"]
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      topics: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_step: string | null
          id: string
          opportunity_score: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          research_progress: number
          source: Database["public"]["Enums"]["topic_source"]
          status: Database["public"]["Enums"]["topic_status"]
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: string | null
          id?: string
          opportunity_score?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          research_progress?: number
          source?: Database["public"]["Enums"]["topic_source"]
          status?: Database["public"]["Enums"]["topic_status"]
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: string | null
          id?: string
          opportunity_score?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          research_progress?: number
          source?: Database["public"]["Enums"]["topic_source"]
          status?: Database["public"]["Enums"]["topic_status"]
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_workspace_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["workspace_role"][]
          target_workspace_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "topic_created"
        | "research_started"
        | "research_completed"
        | "brief_created"
        | "brief_approved"
        | "discovery_completed"
      brief_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "revision_requested"
      confidence_level: "high" | "medium" | "low"
      job_status: "pending" | "processing" | "completed" | "failed"
      priority_level: "high" | "medium" | "low"
      source_type:
        | "official"
        | "review"
        | "article"
        | "forum"
        | "product"
        | "comparison"
      topic_source: "user" | "ai"
      topic_status: "pending" | "processing" | "completed" | "failed"
      workspace_role: "owner" | "admin" | "member"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "topic_created",
        "research_started",
        "research_completed",
        "brief_created",
        "brief_approved",
        "discovery_completed",
      ],
      brief_status: [
        "draft",
        "pending_review",
        "approved",
        "revision_requested",
      ],
      confidence_level: ["high", "medium", "low"],
      job_status: ["pending", "processing", "completed", "failed"],
      priority_level: ["high", "medium", "low"],
      source_type: [
        "official",
        "review",
        "article",
        "forum",
        "product",
        "comparison",
      ],
      topic_source: ["user", "ai"],
      topic_status: ["pending", "processing", "completed", "failed"],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const

