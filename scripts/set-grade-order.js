// scripts/set-grade-order.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define the desired order for grade names
const gradeOrderMap = {
    'Primero': 1,
    'Segundo': 2,
    'Tercero': 3,
    'Cuarto': 4,
    'Quinto': 5,
    'Sexto': 6,
    'Extraordinario': 7,
};

async function main() {
    console.log('Starting script to set grade order...');

    // 1. Find the active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true },
    });

    if (!activeSchoolYear) {
        console.error('Error: No active school year found. Please ensure one school year is marked as active.');
        process.exit(1);
    }
    console.log(`Found active school year: ${activeSchoolYear.name} (ID: ${activeSchoolYear.id})`);

    // 2. Fetch all grades for the active school year
    const grades = await prisma.grade.findMany({
        where: { schoolYearId: activeSchoolYear.id },
    });

    console.log(`Found ${grades.length} grades for the active school year.`);

    // 3. Update the order for each grade based on the map
    let updatedCount = 0;
    for (const grade of grades) {
        const orderValue = gradeOrderMap[grade.name];
        if (orderValue !== undefined) {
            // Only update if the current order is different or the default (99)
            if (grade.order !== orderValue) {
                await prisma.grade.update({
                    where: { id: grade.id },
                    data: { order: orderValue },
                });
                console.log(`Set order for ${grade.name} to ${orderValue}`);
                updatedCount++;
            } else {
                console.log(`Order for ${grade.name} is already correct (${orderValue}). Skipping.`);
            }
        } else {
            console.warn(`Warning: Grade name "${grade.name}" not found in order map. Its order remains unchanged (${grade.order}).`);
        }
    }

    console.log(`Successfully updated order for ${updatedCount} grades.`);
    console.log('Grade order setting script completed.');
}

main()
    .catch((e) => {
        console.error('Error in set grade order script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
