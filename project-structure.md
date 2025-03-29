Hierarchical Text Overview

school-app2/
├── prisma/                    # Database ORM layer
│   ├── migrations/            # Database migration scripts
│   ├── schema.prisma          # Database schema definition
│   └── seed.js                # Database seeding script
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Protected routes requiring authentication
│   │   ├── api/               # API endpoints (route handlers)
│   │   ├── error/             # Error handling pages
│   │   ├── fonts/             # Font assets
│   │   ├── login/             # Authentication pages
│   │   ├── favicon.ico        # Site favicon
│   │   ├── globals.css        # Global CSS
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Root page component
│   ├── components/            # Reusable UI components
│   │   ├── calendar/          # Calendar-related components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components (navbar, sidebar)
│   │   ├── payments/          # Payment-related components
│   │   ├── skeletons/         # Loading skeleton components
│   │   ├── students/          # Student management components
│   │   ├── tutors/            # Tutor management components
│   │   └── ui/                # UI primitive components (shadcn/ui)
│   └── lib/                   # Utility functions and services
│       ├── utils/             # Utility helper functions
│       └── db.ts              # Prisma database client
└── [configuration files]      # Project configuration files
    ├── middleware.ts          # Next.js middleware (auth protection)
    ├── next.config.mjs        # Next.js configuration
    ├── tailwind.config.ts     # Tailwind CSS configuration
    ├── package.json           # NPM dependencies
    └── ...                    # Other config files


Key Architecture Patterns

Next.js App Router Structure:

Uses the /app directory for routing
Protected routes under the (auth) folder
API routes as route handlers under api/


Component Organization:

Domain-specific folders (payments, students, etc.)
UI primitives separated in ui/ (shadcn/ui components)
Loading states in dedicated skeletons/ folder


Database Layer:

Prisma ORM for database access
Structured migrations in prisma/migrations
Central database client in lib/db.ts


Patterns and Conventions

Naming Conventions:

Domain-based folder organization (payments, students, tutors)
Next.js routing conventions (page.tsx, layout.tsx)
API endpoints as route.ts files


Component Structure:

UI primitives are separate from business components
Loading states separated as skeleton components
Complex state management likely in form components