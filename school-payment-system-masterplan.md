# School Payment Management System - Masterplan

## 1. App Overview and Objectives

The School Payment Management System is a web application designed to help administrative staff at a small private school manage and track student tuition payments. The system will replace the current manual process of handwritten receipts and Excel spreadsheets with a modern, efficient digital solution.

**Primary Objectives:**
- Streamline the payment recording process
- Provide clear visualization of payment statuses for each student
- Track partial payments and maintain accurate balance records
- Generate printed receipts compatible with standard ticket printers
- Maintain historical payment records
- Support different fee structures by grade level and school year

## 2. Target Audience

The primary users of this system will be:
- School administrative staff (3-10 employees)
- Office clerks who process payments from parents/tutors

The system is strictly for administrative use and will not be accessed by parents or students directly.

## 3. Core Features and Functionality

### 3.1 User Authentication
- Secure login system for administrative staff
- No user registration (accounts created by developers/admins)
- Simple role-based access (all staff have the same level of access)

### 3.2 Student and Tutor Management (CRUD)
- Create, read, update, and delete student records
- Store essential student information (name, grade, assigned tutor)
- Manage tutor/parent information (name, contact details, associated students)
- Track historical data for former students

### 3.3 Payment Processing
- Record full or partial payments for students
- Associate payments with specific students, months, and school years
- Track payment methods (cash, card)
- Maintain running balance calculations (including handling advance payments)
- Support different fee structures based on grade level and school year

### 3.4 Payment Visualization
- Monthly calendar view showing payment status by student
- Visual indicators for paid, partially paid, and unpaid months
- Quick view of outstanding balances

### 3.5 Receipt Generation
- Generate digital receipts for payments
- Print receipts compatible with standard ticket printers
- Include essential information (student name, amount, date, clerk name, school logo)

### 3.6 Reporting
- Generate reports for students with outstanding balances
- Track payment trends over time
- View payment history by student, month, or school year

### 3.7 Offline Support
- Basic functionality during internet outages
- Temporary storage of payment data
- Synchronization when connection is restored

## 4. Technical Stack

### 4.1 Frontend
- **Framework**: Next.js (React-based)
- **Styling**: Tailwind CSS for utility-first styling
- **Component Library**: Shadcn/UI for consistent UI elements
- **Calendar Visualization**: React Big Calendar for payment status display
- **State Management**: React Context API or zustand for global state

### 4.2 Backend
- **Framework**: Next.js API routes for server functionality
- **Authentication**: Supabase Authentication
- **File Storage**: Supabase Storage (for receipt templates, school logo)

### 4.3 Database
- **Database Provider**: Supabase (PostgreSQL)
- **ORM**: Prisma for type-safe database access

### 4.4 Deployment
- **Hosting**: Vercel (optimal for Next.js applications)
- **CI/CD**: GitHub integration with Vercel for automated deployments

## 5. Conceptual Data Model

### 5.1 Key Entities

**SchoolYear**
- id: UUID
- name: String (e.g., "2023-2024")
- startDate: Date
- endDate: Date
- active: Boolean

**Grade**
- id: UUID
- name: String (e.g., "First Grade")
- tuitionAmount: Decimal
- schoolYearId: UUID (foreign key)

**Tutor**
- id: UUID
- name: String
- phone: String
- email: String
- address: String (optional)

**Student**
- id: UUID
- name: String
- gradeId: UUID (foreign key)
- tutorId: UUID (foreign key)
- active: Boolean
- balance: Decimal (current balance)

**Payment**
- id: UUID
- studentId: UUID (foreign key)
- amount: Decimal
- paymentDate: Date
- paymentMethod: Enum (CASH, CARD)
- forMonth: String/Int (which month this payment applies to)
- forYear: UUID (foreign key to SchoolYear)
- clerkId: UUID (foreign key to User)
- receiptNumber: String
- isPartial: Boolean
- notes: String (optional)

**User (Clerk)**
- id: UUID
- name: String
- email: String
- role: String (default: "clerk")

## 6. User Interface Design Principles

### 6.1 Layout Structure
- Clean, minimalist interface focused on readability
- Consistent navigation between key sections
- Responsive design for different screen sizes (primarily desktop-focused)

### 6.2 Key Screens

**Dashboard**
- Overview of recent payments
- Quick access to common functions
- Summary of outstanding balances

**Student Search**
- Search field for finding students by name
- Filter options (by grade, tutor, payment status)
- Results list with key student information

**Student Profile**
- Student details and tutor information
- Payment history
- Calendar visualization of payment status
- Current balance

**Payment Recording**
- Form for entering payment details
- Selection of month(s) being paid
- Options for full or partial payments
- Receipt generation

**Reports**
- Outstanding balances report
- Payment collection trends
- Customizable date ranges

### 6.3 Visual Design
- School color scheme integration
- Clear visual cues for payment status (paid, partial, unpaid)
- Accessible design (good contrast, readable fonts)

## 7. Security Considerations

### 7.1 Authentication Security
- Supabase authentication with email/password
- Secure session management
- Access control for all API routes

### 7.2 Data Protection
- All sensitive data encrypted at rest in Supabase
- HTTPS for all communications
- Input validation to prevent injection attacks

### 7.3 Audit Trail
- Logging of all payment transactions
- Record of which clerk processed each payment
- Tracking of changes to student records

## 8. Development Phases

### 8.1 Phase 1: Foundation
- Set up Next.js project with Tailwind CSS and Shadcn/UI
- Configure Supabase for authentication and database
- Implement data models and basic CRUD operations
- Create basic UI layouts and navigation

### 8.2 Phase 2: Core Functionality
- Implement student and tutor management
- Develop payment recording functionality
- Create basic payment visualization (calendar view)
- Set up receipt generation and printing

### 8.3 Phase 3: Enhancement
- Add reporting capabilities
- Implement offline support
- Add data validation and error handling
- Optimize database queries for performance

### 8.4 Phase 4: Testing and Deployment
- Comprehensive testing with real school data
- Staff training and documentation
- Production deployment
- Post-launch support and monitoring

## 9. Potential Challenges and Solutions

### 9.1 Data Migration
**Challenge**: Converting existing Excel data into the new system
**Solution**: 
- Create import tools to parse Excel data
- Implement validation to ensure data integrity
- Provide a staged migration approach to verify data accuracy

### 9.2 Printer Integration
**Challenge**: Ensuring compatibility with ticket printers
**Solution**:
- Use browser-based printing APIs compatible with ticket printers
- Create configurable receipt templates
- Test with actual hardware before deployment

### 9.3 Offline Support
**Challenge**: Maintaining functionality during connectivity issues
**Solution**:
- Implement Progressive Web App features
- Use client-side storage for temporary data
- Create robust synchronization logic

### 9.4 User Adoption
**Challenge**: Staff transitioning from manual processes
**Solution**:
- Intuitive UI design focused on simplicity
- Provide thorough training sessions
- Create quick reference guides for common tasks

## 10. Future Expansion Possibilities

### 10.1 Parent Portal
- Secure login for parents/tutors
- Self-service payment history viewing
- Online payment capabilities

### 10.2 Notification System
- Automated payment reminders via email or SMS
- Alerts for overdue payments
- Monthly statements to parents

### 10.3 Advanced Reporting
- Financial projections based on payment history
- Custom report builder
- Export capabilities to accounting software

### 10.4 Multi-School Support
- Expand the system to handle multiple schools
- Centralized administration
- School-specific configurations and branding

## 11. Technical Implementation Notes

### 11.1 Next.js Application Structure
- `/pages` - Page components and API routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and helpers
- `/prisma` - Database schema and migrations
- `/public` - Static assets (school logo, etc.)

### 11.2 Key API Endpoints
- `/api/students` - CRUD operations for students
- `/api/tutors` - CRUD operations for tutors
- `/api/payments` - Payment processing and retrieval
- `/api/reports` - Report generation

### 11.3 State Management
- Use React Context for application-wide state
- Consider zustand for more complex state requirements
- Leverage SWR or React Query for data fetching and caching

### 11.4 Testing Strategy
- Unit tests for utility functions and components
- Integration tests for API endpoints
- End-to-end tests for critical user flows

## 12. Conclusion

This School Payment Management System will significantly improve the efficiency of payment processing and tracking for the school's administrative staff. By replacing manual processes with a digital solution, the school will benefit from better record-keeping, reduced errors, and improved financial oversight.

The phased development approach will ensure the system can be implemented gradually, allowing staff to adapt to the new processes while maintaining existing operations. The technology stack chosen provides a balance of modern features, ease of development, and long-term maintainability.
