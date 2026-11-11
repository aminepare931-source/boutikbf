export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_auto_generated: boolean | null
          keywords: string[] | null
          name: string
          parent_id: string | null
          shop_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          keywords?: string[] | null
          name: string
          parent_id?: string | null
          shop_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          keywords?: string[] | null
          name?: string
          parent_id?: string | null
          shop_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          credit_balance: number
          email: string | null
          id: string
          loyalty_points: number
          name: string
          notes: string | null
          phone: string | null
          shop_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          id?: string
          loyalty_points?: number
          name: string
          notes?: string | null
          phone?: string | null
          shop_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          id?: string
          loyalty_points?: number
          name?: string
          notes?: string | null
          phone?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_credentials: {
        Row: {
          employee_id: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          employee_id: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          employee_id?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_credentials_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_login_attempts: {
        Row: {
          attempted_at: string
          id: number
          login_key: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          id?: number
          login_key: string
          success: boolean
        }
        Update: {
          attempted_at?: string
          id?: number
          login_key?: string
          success?: boolean
        }
        Relationships: []
      }
      employee_messages: {
        Row: {
          created_at: string
          employee_name: string
          employee_role: string
          id: string
          message: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          employee_name: string
          employee_role: string
          id?: string
          message: string
          shop_id: string
        }
        Update: {
          created_at?: string
          employee_name?: string
          employee_role?: string
          id?: string
          message?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_messages_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sessions: {
        Row: {
          created_at: string
          employee_id: string
          expires_at: string
          role: string
          shop_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          expires_at: string
          role: string
          shop_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          expires_at?: string
          role?: string
          shop_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_sessions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string
          shop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_data: {
        Row: {
          category_column: string | null
          columns: Json
          created_at: string
          file_name: string
          id: string
          rows: Json
          shop_id: string
        }
        Insert: {
          category_column?: string | null
          columns: Json
          created_at?: string
          file_name: string
          id?: string
          rows: Json
          shop_id: string
        }
        Update: {
          category_column?: string | null
          columns?: Json
          created_at?: string
          file_name?: string
          id?: string
          rows?: Json
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_data_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          batch_label: string | null
          brand: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          expiry_date: string | null
          extra: Json
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          promo_end: string | null
          promo_price: number | null
          promo_start: string | null
          sale_price: number
          search_vector: unknown
          shop_id: string
          sku: string | null
          stock: number
          stock_min: number | null
          tax_rate: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          batch_label?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          extra?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          promo_end?: string | null
          promo_price?: number | null
          promo_start?: string | null
          sale_price?: number
          search_vector?: unknown
          shop_id: string
          sku?: string | null
          stock?: number
          stock_min?: number | null
          tax_rate?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          batch_label?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          extra?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          promo_end?: string | null
          promo_price?: number | null
          promo_start?: string | null
          sale_price?: number
          search_vector?: unknown
          shop_id?: string
          sku?: string | null
          stock?: number
          stock_min?: number | null
          tax_rate?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          id: string
          name: string
          product_id: string | null
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          name: string
          product_id?: string | null
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number | null
          cashier_id: string | null
          change_due: number
          created_at: string
          customer_id: string | null
          discount: number
          employee_id: string | null
          id: string
          payment_method: string
          payments: Json | null
          reference: string | null
          shop_id: string
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          amount_paid?: number | null
          cashier_id?: string | null
          change_due?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          payment_method?: string
          payments?: Json | null
          reference?: string | null
          shop_id: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          amount_paid?: number | null
          cashier_id?: string | null
          change_due?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          payment_method?: string
          payments?: Json | null
          reference?: string | null
          shop_id?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_admin_notes: {
        Row: {
          notes: string | null
          shop_id: string
          updated_at: string
        }
        Insert: {
          notes?: string | null
          shop_id: string
          updated_at?: string
        }
        Update: {
          notes?: string | null
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_admin_notes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          method: string
          note: string | null
          paid_at: string
          period_end: string | null
          period_start: string | null
          plan: string | null
          shop_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          plan?: string | null
          shop_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          plan?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          is_suspended: boolean
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          plan: string
          shop_keywords: string[] | null
          shop_type: string | null
          slug: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          plan?: string
          shop_keywords?: string[] | null
          shop_type?: string | null
          slug: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          plan?: string
          shop_keywords?: string[] | null
          shop_type?: string | null
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_counts: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          id: string
          lines: Json
          note: string | null
          shop_id: string
          status: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lines?: Json
          note?: string | null
          shop_id: string
          status?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lines?: Json
          note?: string | null
          shop_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          quantity: number
          reason: string | null
          shop_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          shop_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          shop_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          from_shop: string
          id: string
          note: string | null
          product_name: string
          quantity: number
          to_shop: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_shop: string
          id?: string
          note?: string | null
          product_name: string
          quantity: number
          to_shop: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_shop?: string
          id?: string
          note?: string | null
          product_name?: string
          quantity?: number
          to_shop?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_shop_fkey"
            columns: ["from_shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_shop_fkey"
            columns: ["to_shop"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          shop_id: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          shop_id: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _admin_log: {
        Args: { p_action: string; p_details?: Json; p_target: string }
        Returns: undefined
      }
      _auto_classify_product_internal: {
        Args: { p_product_id: string }
        Returns: string
      }
      _generate_default_categories_internal: {
        Args: { p_shop_id: string }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_auto_generated: boolean | null
          keywords: string[] | null
          name: string
          parent_id: string | null
          shop_id: string
          sort_order: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "categories"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      _generate_pin: { Args: never; Returns: string }
      _norm_role: { Args: { r: string }; Returns: string }
      adjust_stock: {
        Args: { p_delta: number; p_product_id: string }
        Returns: number
      }
      admin_add_shop_payment: {
        Args: {
          p_amount: number
          p_method?: string
          p_note?: string
          p_paid_at?: string
          p_period_end?: string
          p_period_start?: string
          p_plan?: string
          p_shop_id: string
        }
        Returns: string
      }
      admin_dashboard: { Args: { p_days?: number }; Returns: Json }
      admin_delete_shop: { Args: { p_shop_id: string }; Returns: undefined }
      admin_delete_shop_payment: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_extend_trial: {
        Args: { p_days: number; p_shop_id: string }
        Returns: undefined
      }
      admin_grant_super_admin: { Args: { p_email: string }; Returns: undefined }
      admin_list_shop_payments: { Args: { p_shop_id: string }; Returns: Json }
      admin_list_shops: {
        Args: never
        Returns: {
          admin_notes: string
          created_at: string
          id: string
          is_suspended: boolean
          last_sale_at: string
          last_sign_in_at: string
          members_count: number
          name: string
          owner_email: string
          owner_id: string
          owner_name: string
          phone: string
          plan: string
          products_count: number
          sales_count: number
          sales_total: number
          slug: string
          trial_ends_at: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          banned_until: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_super_admin: boolean
          last_sign_in_at: string
          phone: string
          shops_count: number
        }[]
      }
      admin_overview: { Args: never; Returns: Json }
      admin_revoke_super_admin: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      admin_set_shop_notes: {
        Args: { p_notes: string; p_shop_id: string }
        Returns: undefined
      }
      admin_set_shop_plan: {
        Args: { p_plan: string; p_shop_id: string }
        Returns: undefined
      }
      admin_set_shop_suspended: {
        Args: { p_shop_id: string; p_suspended: boolean }
        Returns: undefined
      }
      admin_set_user_banned: {
        Args: { p_banned: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_shop_details: {
        Args: { p_days?: number; p_shop_id: string }
        Returns: Json
      }
      apply_stock_count: { Args: { p_count_id: string }; Returns: number }
      auto_classify_product: { Args: { p_product_id: string }; Returns: string }
      auto_classify_shop_products: {
        Args: { p_shop_id: string }
        Returns: {
          category_id: string
          category_name: string
          product_id: string
        }[]
      }
      create_employee: {
        Args: {
          p_name: string
          p_phone: string
          p_role: string
          p_shop_id: string
        }
        Returns: Json
      }
      employee_ctx: {
        Args: never
        Returns: {
          employee_id: string
          role: string
          shop_id: string
        }[]
      }
      employee_id: { Args: never; Returns: string }
      employee_login: { Args: { p_name: string; p_pin: string }; Returns: Json }
      employee_logout: { Args: { p_token: string }; Returns: undefined }
      employee_role: { Args: never; Returns: string }
      employee_shop_id: { Args: never; Returns: string }
      generate_default_categories: {
        Args: { p_shop_id: string }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_auto_generated: boolean | null
          keywords: string[] | null
          name: string
          parent_id: string | null
          shop_id: string
          sort_order: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "categories"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_shop_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _shop_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_shop_manager: { Args: { _shop_id: string }; Returns: boolean }
      is_shop_member: {
        Args: { _shop_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      receive_purchase: {
        Args: {
          p_lines: Json
          p_note?: string
          p_shop_id: string
          p_supplier_id: string
        }
        Returns: undefined
      }
      reset_employee_pin: { Args: { p_employee_id: string }; Returns: Json }
      transfer_stock: {
        Args: {
          p_from_shop: string
          p_note?: string
          p_product_id: string
          p_qty: number
          p_to_shop: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "accountant"
        | "cashier"
        | "stock_keeper"
        | "purchaser"
        | "sales"
        | "marketing"
        | "employee"
        | "delivery"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "admin",
        "manager",
        "accountant",
        "cashier",
        "stock_keeper",
        "purchaser",
        "sales",
        "marketing",
        "employee",
        "delivery",
      ],
    },
  },
} as const
