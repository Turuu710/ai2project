import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request){
    try{
        const body = await request.json(); 
        const { email, id } = body;
        
    // Энийг ингэж засах хэрэгтэй:
const user = await prisma.user.create({
    data: {
        email: email, // body-оос ирсэн email-ийг ашиглах
        name: "User Name", // энийг бас body-оос авч болно
        clerkId: id,   // body-оос ирсэн id-ийг ашиглах
    }
});
        return NextResponse.json({message: "Bolson", user}, {status: 200})
    } catch (error) {
    console.error("Prisma Error:", error); 
    return new Response(`Aldaa: ${error instanceof Error ? error.message : "Unknown"}`, { status: 500 });
    }
}