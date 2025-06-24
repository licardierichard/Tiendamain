import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schemas
export const createTables = async () => {
  // Users table
  const { error: usersError } = await supabase.rpc("create_users_table")
  if (usersError) console.error("Error creating users table:", usersError)

  // Orders table
  const { error: ordersError } = await supabase.rpc("create_orders_table")
  if (ordersError) console.error("Error creating orders table:", ordersError)

  // Email verification tokens table
  const { error: tokensError } = await supabase.rpc("create_verification_tokens_table")
  if (tokensError) console.error("Error creating tokens table:", tokensError)
}

// User authentication functions
export const authService = {
  async register(userData) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone,
        },
      },
    })
    return { data, error }
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  },

  async resendVerification(email) {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    })
    return { data, error }
  },
}

// Database operations
export const dbService = {
  async createUser(userData) {
    const { data, error } = await supabase.from("users").insert([userData]).select()
    return { data, error }
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()
    return { data, error }
  },

  async updateUser(userId, userData) {
    const { data, error } = await supabase.from("users").update(userData).eq("id", userId).select()
    return { data, error }
  },

  async createOrder(orderData) {
    const { data, error } = await supabase.from("orders").insert([orderData]).select()
    return { data, error }
  },

  async getUserOrders(userId) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    return { data, error }
  },

  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select()
    return { data, error }
  },
}
