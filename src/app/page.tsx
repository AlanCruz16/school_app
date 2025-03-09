// src/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  } else {
    redirect('/dashboard')
  }
}