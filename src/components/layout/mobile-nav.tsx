// src/components/layout/mobile-nav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import {
    CalendarDays,
    CreditCard,
    Home,
    Menu,
    Settings,
    User,
    Users,
    X,
    GraduationCap
} from 'lucide-react'

const mobileLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Tutors', href: '/tutors', icon: User },
    { name: 'Grades', href: '/grades', icon: GraduationCap },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export default function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    return (
        <div className="md:hidden">
            <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
            </Button>
            {open && (
                <div className="fixed inset-0 z-50 bg-background">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h1 className="text-xl font-bold">School Pay</h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setOpen(false)}
                            >
                                <X className="h-6 w-6" />
                                <span className="sr-only">Close menu</span>
                            </Button>
                        </div>
                        <nav className="flex-1 px-4 py-6 overflow-y-auto">
                            <ul className="space-y-4">
                                {mobileLinks.map((link) => {
                                    const Icon = link.icon
                                    return (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                onClick={() => setOpen(false)}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium',
                                                    pathname === link.href
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-accent hover:text-accent-foreground'
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                {link.name}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    )
}