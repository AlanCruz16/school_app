// src/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()

  // Use getUser() instead of getSession() for better security
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  } else {
    redirect('/dashboard')
  }
}