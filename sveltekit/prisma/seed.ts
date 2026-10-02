import { prisma } from "../src/lib/server/prisma.ts";
import { MONSTER_TEMPLATES } from "../src/routes/monster/monstersDB/monster.ts";

async function main() {
  console.log("🌱 Seeding monster templates...");
  
  for (const template of MONSTER_TEMPLATES) {
    await prisma.monsterTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  
  console.log("✅ Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });