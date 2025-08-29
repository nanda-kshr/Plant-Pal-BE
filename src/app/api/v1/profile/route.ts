import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = req.headers.get("user_id") || '';
    const profile = await db.collection("users").findOne({_id: new ObjectId(user_id)}, {projection: {_id:0, password:0}});
    return NextResponse.json({profile: profile}, {status: 200});
}

export async function PUT(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = req.headers.get("user_id") || ''; 
    const body = await req.json();
    const { name, email } = body;
    
    const updateData: Record<string, string> = {};
    if (name !== null && name !== undefined) updateData.name = name;
    if (email !== null && email !== undefined) updateData.email = email;
    await db.collection("users").updateOne({ _id: new ObjectId(user_id) }, { $set: updateData }, { upsert: true });
    return NextResponse.json({message: 'Successfully saved the settings'}, {status: 200});
}
