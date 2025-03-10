// prisma/seed.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Starting seed script...')

    // Create a school year
    const currentSchoolYear = await prisma.schoolYear.create({
        data: {
            name: '2024-2025',
            startDate: new Date('2024-09-01'),
            endDate: new Date('2025-06-30'),
            active: true,
        },
    })
    console.log(`Created school year: ${currentSchoolYear.name}`)

    // Create grades
    const grades = await Promise.all([
        prisma.grade.create({
            data: {
                name: 'First Grade',
                tuitionAmount: 500.00,
                schoolYearId: currentSchoolYear.id,
            },
        }),
        prisma.grade.create({
            data: {
                name: 'Second Grade',
                tuitionAmount: 550.00,
                schoolYearId: currentSchoolYear.id,
            },
        }),
        prisma.grade.create({
            data: {
                name: 'Third Grade',
                tuitionAmount: 600.00,
                schoolYearId: currentSchoolYear.id,
            },
        }),
    ])
    console.log(`Created ${grades.length} grades`)

    // Create tutors
    const tutors = await Promise.all([
        prisma.tutor.create({
            data: {
                name: 'John Smith',
                phone: '123-456-7890',
                email: 'john.smith@example.com',
                address: '123 Main St',
            },
        }),
        prisma.tutor.create({
            data: {
                name: 'Jane Doe',
                phone: '987-654-3210',
                email: 'jane.doe@example.com',
                address: '456 Oak Ave',
            },
        }),
    ])
    console.log(`Created ${tutors.length} tutors`)

    // Create students
    const students = await Promise.all([
        prisma.student.create({
            data: {
                name: 'Alice Smith',
                gradeId: grades[0].id,
                tutorId: tutors[0].id,
                active: true,
                balance: 0,
            },
        }),
        prisma.student.create({
            data: {
                name: 'Bob Smith',
                gradeId: grades[1].id,
                tutorId: tutors[0].id,
                active: true,
                balance: 0,
            },
        }),
        prisma.student.create({
            data: {
                name: 'Charlie Doe',
                gradeId: grades[2].id,
                tutorId: tutors[1].id,
                active: true,
                balance: 0,
            },
        }),
    ])
    console.log(`Created ${students.length} students`)

    // Create a test user (clerk)
    const clerk = await prisma.user.create({
        data: {
            name: 'Test Clerk',
            email: 'clerk@school.com',
            role: 'clerk',
        }
    })
    console.log(`Created test clerk: ${clerk.name}`)

    console.log('Seed script completed successfully!')
}

main()
    .catch((e) => {
        console.error('Error in seed script:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })