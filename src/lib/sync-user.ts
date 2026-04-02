import { prisma } from "@/lib/prisma";

type SyncUserInput = {
  clerkId: string;
  email: string;
  name?: string | null;
};

export async function syncUser({
  clerkId,
  email,
  name,
}: SyncUserInput) {
  const safeEmail = email.trim().toLowerCase();
  const safeName = name?.trim() || "User";

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ clerkId }, { email: safeEmail }],
    },
  });

  if (existingUser) {
    return await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerkId,
        email: safeEmail,
        name: safeName,
      },
    });
  }

  return await prisma.user.create({
    data: {
      clerkId,
      email: safeEmail,
      name: safeName,
    },
  });
}