import prisma from './src/config/prisma';

async function main() {
    console.log('🌱 Seeding database...');

    const plans = [
        { name: 'FREE', maxChannels: 1, maxPlatforms: 1, maxClipsPerMonth: 5 },
        { name: 'PRO', maxChannels: 5, maxPlatforms: 3, maxClipsPerMonth: 50 },
        { name: 'CREATOR', maxChannels: 20, maxPlatforms: 5, maxClipsPerMonth: 200 },
    ];

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { name: plan.name as any },
            update: plan,
            create: {
                name: plan.name as any,
                maxChannels: plan.maxChannels,
                maxPlatforms: plan.maxPlatforms,
                maxClipsPerMonth: plan.maxClipsPerMonth
            }
        });
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
