export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_auto_generated: boolean;
          keywords: string[] | null;
          name: string;
          parent_id: string | null;
          shop_id: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_auto_generated?: boolean;
          keywords?: string[] | null;
          name: string;
          parent_id?: string | null;
          shop_id: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_auto_generated?: boolean;
          keywords?: string[] | null;
          name?: string;
          parent_id?: string | null;
          shop_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          created_at: string;
          credit_balance: number;
          email: string | null;
          id: string;
          loyalty_points: number;
          name: string;
          notes: string | null;
          phone: string | null;
          shop_id: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          credit_balance?: number;
          email?: string | null;
          id?: string;
          loyalty_points?: number;
          name: string;
          notes?: string | null;
          phone?: string | null;
          shop_id: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          credit_balance?: number;
          email?: string | null;
          id?: string;
          loyalty_points?: number;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          shop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          barcode: string | null;
          brand: string | null;
          category_id: string | null;
          cost_price: number;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          promo_price: number | null;
          sale_price: number;
          shop_id: string;
          sku: string | null;
          stock: number;
          stock_min: number | null;
          tax_rate: number | null;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          barcode?: string | null;
          brand?: string | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          promo_price?: number | null;
          sale_price?: number;
          shop_id: string;
          sku?: string | null;
          stock?: number;
          stock_min?: number | null;
          tax_rate?: number | null;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          barcode?: string | null;
          brand?: string | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          promo_price?: number | null;
          sale_price?: number;
          shop_id?: string;
          sku?: string | null;
          stock?: number;
          stock_min?: number | null;
          tax_rate?: number | null;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          name: string;
          product_id: string | null;
          quantity: number;
          sale_id: string;
          total: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          name: string;
          product_id?: string | null;
          quantity: number;
          sale_id: string;
          total: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          name?: string;
          product_id?: string | null;
          quantity?: number;
          sale_id?: string;
          total?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          cashier_id: string | null;
          created_at: string;
          customer_id: string | null;
          discount: number;
          id: string;
          payment_method: string;
          reference: string | null;
          shop_id: string;
          status: string;
          subtotal: number;
          tax: number;
          total: number;
        };
        Insert: {
          cashier_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          discount?: number;
          id?: string;
          payment_method?: string;
          reference?: string | null;
          shop_id: string;
          status?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
        };
        Update: {
          cashier_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          discount?: number;
          id?: string;
          payment_method?: string;
          reference?: string | null;
          shop_id?: string;
          status?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_members: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          shop_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          shop_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          shop_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shops: {
        Row: {
          address: string | null;
          country: string | null;
          created_at: string;
          currency: string;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          plan: string;
          shop_keywords: string[] | null;
          shop_type: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          plan?: string;
          shop_keywords?: string[] | null;
          shop_type?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          plan?: string;
          shop_keywords?: string[] | null;
          shop_type?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          product_id: string;
          quantity: number;
          reason: string | null;
          shop_id: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_id: string;
          quantity: number;
          reason?: string | null;
          shop_id: string;
          type: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          reason?: string | null;
          shop_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          address: string | null;
          balance: number;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          shop_id: string;
        };
        Insert: {
          address?: string | null;
          balance?: number;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          shop_id: string;
        };
        Update: {
          address?: string | null;
          balance?: number;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          shop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auto_classify_product: {
        Args: { p_product_id: string };
        Returns: string;
      };
      auto_classify_shop_products: {
        Args: { p_shop_id: string };
        Returns: {
          product_id: string;
          category_id: string;
          category_name: string;
        }[];
      };
      generate_default_categories: {
        Args: { p_shop_id: string };
        Returns: {
          id: string;
          shop_id: string;
          name: string;
          description: string | null;
          keywords: string[] | null;
          parent_id: string | null;
          created_at: string;
          sort_order: number;
          is_auto_generated: boolean;
        }[];
      };
      has_shop_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _shop_id: string;
          _user_id: string;
        };
        Returns: boolean;
      };
      is_shop_member: {
        Args: { _shop_id: string; _user_id: string };
        Returns: boolean;
      };
    };
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
        | "delivery";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

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
} as const;
