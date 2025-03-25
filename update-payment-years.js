// update-payment-years.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Starting to update payment years...')

    // Get all payments
    const payments = await prisma.payment.findMany({
        include: {
            schoolYear: true
        }
    })

    console.log(`Found ${payments.length} payments to process`)

    // Process each payment
    let updated = 0
    for (const payment of payments) {
        // Determine the year based on payment date and school year
        const paymentDate = new Date(payment.paymentDate)
        const paymentYear = paymentDate.getFullYear()

        // Get school year start and end
        const schoolYearStart = new Date(payment.schoolYear.startDate)
        const schoolYearEnd = new Date(payment.schoolYear.endDate)

        // Determine correct year based on school year and month
        let correctYear

        // If month is clearly in one year of the school year, use that
        if (payment.forMonth >= 8) { // Aug-Dec are typically in the first year of school year
            correctYear = schoolYearStart.getFullYear()
        } else { // Jan-Jul are typically in the second year
            correctYear = schoolYearEnd.getFullYear()
        }

        // Update the payment with the correct year
        if (!payment.forYear || payment.forYear !== correctYear) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { forYear: correctYear }
            })
            updated++
            console.log(`Updated payment ${payment.id}: Month ${payment.forMonth} set to Year ${correctYear}`)
        }
    }

    console.log(`Updated ${updated} payments with correct years`)
}

main()
    .catch((e) => {
        console.error('Error updating payment years:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })