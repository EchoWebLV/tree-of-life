import { prisma } from "./prisma";

const DAILY_LIMIT = 2;

export async function canUserDeploy(clientToken: string): Promise<boolean> {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  const deploymentCount = await prisma.tokenDeployment.count({
    where: {
      clientToken: clientToken,
      createdAt: {
        gte: midnight
      }
    }
  });

  return deploymentCount < DAILY_LIMIT;
}

export async function recordDeployment(clientToken: string): Promise<void> {
  await prisma.tokenDeployment.create({
    data: {
      clientToken
    }
  });
} 