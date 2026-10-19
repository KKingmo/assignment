// public.books의 SQL 스키마와 대응하는 Data API 타입.
export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          title: string;
          kind: string;
          cover_path: string;
          list_price: number;
          sale_price: number | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          title: string;
          kind: string;
          cover_path: string;
          list_price: number;
          sale_price?: number | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          title?: string;
          kind?: string;
          cover_path?: string;
          list_price?: number;
          sale_price?: number | null;
          sort_order?: number;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
