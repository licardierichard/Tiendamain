import { createClient } from "@supabase/supabase-js"

// Cliente administrativo con service role key
export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Funciones administrativas
export const adminService = {
  async createUser(userData) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        phone: userData.phone,
      },
    })
    return { data, error }
  },

  async deleteUser(userId) {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    return { data, error }
  },

  async updateUserMetadata(userId, metadata) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: metadata })
    return { data, error }
  },

  async getAllUsers() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    return { data, error }
  },
}
