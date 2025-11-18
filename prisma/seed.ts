import { PrismaClient, ReportCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.report.createMany({
    data: [
      {
        phoneNumber: "+639171234567",
        message: "Busted streetlight near sari-sari store",
        category: ReportCategory.INFRASTRUCTURE,
        priority: "MEDIUM",
        status: "OPEN",
        aiReply: "We have logged the streetlight issue and scheduled maintenance.",
        confidence: 0.82
      },
      {
        phoneNumber: "+639189876543",
        message: "Baha sa Purok 3 hanggang tuhod",
        category: ReportCategory.DISASTER,
        priority: "HIGH",
        status: "ACKNOWLEDGED",
        aiReply: "Please move to higher ground and wait for our rescue team.",
        confidence: 0.91
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
