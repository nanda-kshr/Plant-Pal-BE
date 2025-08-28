import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = req.headers.get("user_id") || '';
    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    if (limit > 20 || limit < 1){
        return NextResponse.json({message: 'limit should be between 1 and 20'}, {status: 400});
    }
    const logs = await db.collection("soil_logs").find({user_id}).skip(skip || 0).limit(limit || 10).toArray();
    return NextResponse.json({logs}, {status: 200});

}


export async function PUT(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = req.headers.get("user_id") || '';
    const body = await req.json();
    const {soil_moisture} = body;
    if (soil_moisture === undefined || soil_moisture === null) {
        return NextResponse.json({message: 'soil_moisture is required'}, {status: 400});
    }
    await db.collection("users").updateOne({_id : new ObjectId(user_id)}, {$set: {soil_moisture}}, {upsert: true});
    await db.collection("soil_logs").insertOne({user_id, soil_moisture, loggedAt: new Date()});
    return NextResponse.json({message: 'Successfully saved the data'}, {status: 200});

}
