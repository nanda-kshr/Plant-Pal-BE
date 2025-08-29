import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = new ObjectId(req.headers.get("user_id") || '');
    
    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const plant_id = url.searchParams.get('plant_id') || '';

    if (!plant_id || !ObjectId.isValid(plant_id)) return NextResponse.json({message: 'Invalid plant_id'}, {status: 400});
    if (limit > 20 || limit < 1) return NextResponse.json({message: 'limit should be between 1 and 20'}, {status: 400});

    const logs = await db.collection("soil_logs").find({_id: new ObjectId(plant_id), user_id: user_id}).sort({ loggedAt: -1 }).skip(skip || 0).limit(limit || 10).toArray();
    return NextResponse.json({logs}, {status: 200});

}

export async function POST(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = new ObjectId(req.headers.get("user_id") || ''); 

    const body = await req.json();
    const { plant_id, soil_moisture } = body;
    
    if (soil_moisture === undefined || soil_moisture === null || isNaN(soil_moisture) || plant_id == undefined || plant_id == null) return NextResponse.json({message: 'soil_moisture is required'}, {status: 400});
    if (!plant_id || !ObjectId.isValid(plant_id)) return NextResponse.json({message: 'Invalid plant_id'}, {status: 400});
    

    await db.collection("plants").updateOne({_id : new ObjectId(plant_id), user_id: user_id}, {$set: {soil_moisture}}, {upsert: true});
    await db.collection("soil_logs").insertOne({user_id, soil_moisture, loggedAt: new Date()});
    return NextResponse.json({message: 'Successfully saved the data'}, {status: 200});

}
