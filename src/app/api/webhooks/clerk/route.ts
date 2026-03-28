// // src/app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Замаа өөрийнхөөрөө шалгаарай
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_KEY;

    if (!WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Missing webhook secret" }, { status: 400 });
    }

    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0]?.email_address;
        const name = `${first_name || ""} ${last_name || ""}`.trim();

        try {
            await prisma.user.create({
                data: {
                    clerkId: id,
                    email: email,
                    name: name || "Шинэ хэрэглэгч",
                }
            });
            return NextResponse.json({ message: "User created in DB" });
        } catch (dbError) {
            console.error("Database Error:", dbError);
            return NextResponse.json({ error: "DB insertion failed" }, { status: 500 });
        }
    }

    return NextResponse.json({ message: "Received" }, { status: 200 });
}