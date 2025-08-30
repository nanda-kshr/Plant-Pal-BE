import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import clientPromise from "@/lib/db";
import * as jose from 'jose';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const body = await req.json();
    const {name, email, password} = body;
    if(!name || !email || !password){
        return NextResponse.json({message: 'All required fields are mandatory'}, {status: 400});
    }
    const existingUser = await db.collection('users').findOne({email});
    if(existingUser){
        return NextResponse.json({message: 'User already exists'}, {status: 400});
    }
    const hashPassword = await bcrypt.hash(password,10);
    
    const user = await db.collection('users').insertOne({name, email, password: hashPassword, createdAt: new Date()});
    const secret = new TextEncoder().encode(process.env.SECRET || '')
    const jwt = await new jose.CompactSign(
                new TextEncoder().encode(JSON.stringify({ user_id: user["insertedId"], name, email, iat: Math.floor(Date.now() / 1000) }))
            )
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret);
    return NextResponse.json({access_token: jwt, message: 'User created successfully'}, {status: 201});

}
