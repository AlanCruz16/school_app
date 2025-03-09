// src/app/(auth)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'
import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/sidebar'

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Use getUser() instead of getSession() for better security
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar user={user} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}