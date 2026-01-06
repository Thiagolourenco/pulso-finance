// Database types (será gerado pelo Supabase CLI)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          full_name: string | null
          monthly_spending_limit: number | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          monthly_spending_limit?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          monthly_spending_limit?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          card_id: string | null
          category_id: string
          amount: number
          description: string
          type: 'income' | 'expense'
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          card_id?: string | null
          category_id: string
          amount: number
          description: string
          type: 'income' | 'expense'
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          card_id?: string | null
          category_id?: string
          amount?: number
          description?: string
          type?: 'income' | 'expense'
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'bank' | 'cash' | 'investment' | 'wallet'
          initial_balance: number
          current_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'bank' | 'cash' | 'investment' | 'wallet'
          initial_balance: number
          current_balance: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'bank' | 'cash' | 'investment' | 'wallet'
          initial_balance?: number
          current_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          user_id: string
          name: string
          credit_limit: number
          closing_day: number
          due_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          credit_limit: number
          closing_day: number
          due_day: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          credit_limit?: number
          closing_day?: number
          due_day?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'expense' | 'income'
          icon: string | null
          color: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'expense' | 'income'
          icon?: string | null
          color?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'expense' | 'income'
          icon?: string | null
          color?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          target_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      card_purchases: {
        Row: {
          id: string
          user_id: string
          card_id: string
          description: string
          total_amount: number
          installments: number
          installment_amount: number
          current_installment: number
          purchase_date: string
          category_id: string | null
          is_recurring: boolean
          is_paid_current_month?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          description: string
          total_amount: number
          installments: number
          installment_amount: number
          current_installment?: number
          purchase_date: string
          category_id?: string | null
          is_recurring?: boolean
          is_paid_current_month?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          description?: string
          total_amount?: number
          installments?: number
          installment_amount?: number
          current_installment?: number
          purchase_date?: string
          category_id?: string | null
          is_recurring?: boolean
          is_paid_current_month?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      card_invoices: {
        Row: {
          id: string
          user_id: string
          card_id: string
          reference_month: string
          closing_date: string
          due_date: string
          status: 'open' | 'closed' | 'paid'
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          reference_month: string
          closing_date: string
          due_date: string
          status?: 'open' | 'closed' | 'paid'
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          reference_month?: string
          closing_date?: string
          due_date?: string
          status?: 'open' | 'closed' | 'paid'
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      recurring_expenses: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          due_day: number
          category_id: string | null
          account_id: string | null
          is_active: boolean
          is_paid_current_month?: boolean
          transaction_id?: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          due_day: number
          category_id?: string | null
          account_id?: string | null
          is_active?: boolean
          is_paid_current_month?: boolean
          transaction_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          due_day?: number
          category_id?: string | null
          account_id?: string | null
          is_active?: boolean
          is_paid_current_month?: boolean
          transaction_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type helpers
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type CardPurchase = Database['public']['Tables']['card_purchases']['Row']
export type CardInvoice = Database['public']['Tables']['card_invoices']['Row']
export type RecurringExpense = Database['public']['Tables']['recurring_expenses']['Row']

