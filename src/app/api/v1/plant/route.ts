import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";


export async function POST(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = new ObjectId(req.headers.get("user_id") || '');
    const body = await req.json();
    const { name, nickname } = body;
    const new_plant = await db.collection("plants").insertOne({user_id: new ObjectId(user_id), name, nickname, status: 'active', createdAt: new Date()});
    return NextResponse.json({plant_id: new_plant["insertedId"], message: 'Successfully added a new plant'}, {status: 200});
}

export async function GET(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const url = new URL(req.url);
    const user_id =  new ObjectId (req.headers.get("user_id") || '');
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    if (limit > 20 || limit < 1){
        return NextResponse.json({message: 'limit should be between 1 and 20'}, {status: 400});
    }
    const plants = await db.collection("plants").find({user_id: user_id, status: 'active'}).skip(skip || 0).limit(limit || 10).toArray();
    return NextResponse.json({plants}, {status: 200});
}

export async function PUT(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = new ObjectId(req.headers.get("user_id") || '');
    const body = await req.json();
    let {plant_id, name, nickname, waterInterval, waterDuration } = body;
    if (waterInterval !== undefined && (!Number.isInteger(waterInterval) || waterInterval < 0)) {
        return NextResponse.json({ message: 'waterInterval must be a non-negative integer' }, { status: 400 });
    }
    if (waterDuration !== undefined && (!Number.isInteger(waterDuration) || waterDuration < 0)) {
        return NextResponse.json({ message: 'waterDuration must be a non-negative integer' }, { status: 400 });
    }
    if (!plant_id || !ObjectId.isValid(plant_id)) {
        return NextResponse.json({message: 'Invalid plant_id'}, {status: 400});
    }
    await db.collection("plants").updateOne({_id : new ObjectId(plant_id), user_id: new ObjectId(user_id)}, {$set: {name, nickname, waterDuration, waterInterval}}, {upsert: true});
    return NextResponse.json({message: 'Successfully saved the data'}, {status: 200});

}

export async function DELETE(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const user_id = new ObjectId(req.headers.get("user_id") || '');
    const body = await req.json();
    const {plant_id} = body;

    if (!plant_id || !ObjectId.isValid(plant_id)) {
        return NextResponse.json({message: 'Invalid plant_id'}, {status: 400});
    }
    
    await db.collection("plants").updateOne({_id : new ObjectId(plant_id), user_id: new ObjectId(user_id)}, {$set: {status: 'inactive'}}, {upsert: true});
    return NextResponse.json({message: 'Successfully saved the data'}, {status: 200});

}

