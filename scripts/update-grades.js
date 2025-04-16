// scripts/update-grades.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting grade update script...');

    // 1. Find the active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true },
    });

    if (!activeSchoolYear) {
        console.error('Error: No active school year found. Please ensure one school year is marked as active.');
        process.exit(1);
    }
    console.log(`Found active school year: ${activeSchoolYear.name} (ID: ${activeSchoolYear.id})`);

    // 2. Define the target grades (Spanish names and tuition)
    const targetGrades = [
        { oldName: 'First Grade', newName: 'Primero', tuition: 500.00 },
        { oldName: 'Second Grade', newName: 'Segundo', tuition: 550.00 },
        { oldName: 'Third Grade', newName: 'Tercero', tuition: 600.00 },
        { newName: 'Cuarto', tuition: 650.00 },
        { newName: 'Quinto', tuition: 700.00 },
        { newName: 'Sexto', tuition: 750.00 },
        { newName: 'Extraordinario', tuition: 800.00 },
    ];

    // 3. Update existing grades and create new ones
    for (const gradeInfo of targetGrades) {
        if (gradeInfo.oldName) {
            // Try to find and update existing grade by old name
            const existingGrade = await prisma.grade.findFirst({
                where: {
                    name: gradeInfo.oldName,
                    schoolYearId: activeSchoolYear.id,
                },
            });

            if (existingGrade) {
                await prisma.grade.update({
                    where: { id: existingGrade.id },
                    data: {
                        name: gradeInfo.newName,
                        // Optionally update tuition if needed, otherwise it keeps its value
                        // tuitionAmount: gradeInfo.tuition,
                    },
                });
                console.log(`Updated grade: ${gradeInfo.oldName} -> ${gradeInfo.newName}`);
            } else {
                // If not found by old name, check if it already exists by new name (maybe script ran partially before)
                const gradeExistsByNewName = await prisma.grade.findFirst({
                    where: {
                        name: gradeInfo.newName,
                        schoolYearId: activeSchoolYear.id,
                    },
                });
                if (!gradeExistsByNewName) {
                    // If it truly doesn't exist, create it (shouldn't happen for Primero-Tercero if seed was run)
                    await prisma.grade.create({
                        data: {
                            name: gradeInfo.newName,
                            tuitionAmount: gradeInfo.tuition,
                            schoolYearId: activeSchoolYear.id,
                            // inscriptionCost uses the default from schema
                        },
                    });
                    console.log(`Created grade (was missing): ${gradeInfo.newName}`);
                } else {
                    console.log(`Grade already exists (or was already updated): ${gradeInfo.newName}`);
                }
            }
        } else {
            // Create new grades (Cuarto, Quinto, Sexto, Extraordinario)
            const existingGrade = await prisma.grade.findFirst({
                where: {
                    name: gradeInfo.newName,
                    schoolYearId: activeSchoolYear.id,
                },
            });
            if (!existingGrade) {
                await prisma.grade.create({
                    data: {
                        name: gradeInfo.newName,
                        tuitionAmount: gradeInfo.tuition,
                        schoolYearId: activeSchoolYear.id,
                        // inscriptionCost uses the default from schema
                    },
                });
                console.log(`Created new grade: ${gradeInfo.newName}`);
            } else {
                console.log(`Grade already exists: ${gradeInfo.newName}`);
            }
        }
    }

    console.log('Grade update script completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error in grade update script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
