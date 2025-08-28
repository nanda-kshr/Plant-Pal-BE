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
    const { name, email, waterInterval, waterDuration } = body;
    if (waterInterval !== undefined && (!Number.isInteger(waterInterval) || waterInterval < 0)) {
        return NextResponse.json({ message: 'waterInterval must be a non-negative integer' }, { status: 400 });
    }
    if (waterDuration !== undefined && (!Number.isInteger(waterDuration) || waterDuration < 0)) {
        return NextResponse.json({ message: 'waterDuration must be a non-negative integer' }, { status: 400 });
    }
    const updateData: any = {};
    if (name !== null && name !== undefined) updateData.name = name;
    if (email !== null && email !== undefined) updateData.email = email;
    if (waterInterval !== null && waterInterval !== undefined) updateData.waterInterval = waterInterval;
    if (waterDuration !== null && waterDuration !== undefined) updateData.waterDuration = waterDuration;
    await db.collection("users").updateOne({ _id: new ObjectId(user_id) }, { $set: updateData }, { upsert: true });
    return NextResponse.json({message: 'Successfully saved the settings'}, {status: 200});

}
