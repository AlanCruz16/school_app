// src/components/layout/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/utils'
import {
    CalendarDays,
    CreditCard,
    Home,
    Settings,
    User,
    Users,
    GraduationCap
} from 'lucide-react'

const sidebarLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Tutors', href: '/tutors', icon: User },
    { name: 'Grades', href: '/grades', icon: GraduationCap },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-card">
            <div className="p-6">
                <h1 className="text-2xl font-bold">School Pay</h1>
            </div>
            <nav className="flex-1 px-4 pb-4">
                <ul className="space-y-1">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                                        pathname === link.href
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {link.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}