import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export const syncUser = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  return await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
    },
    create: {
      clerkId: userId,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
    },
  });
};