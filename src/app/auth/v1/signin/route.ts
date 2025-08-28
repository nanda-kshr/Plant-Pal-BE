import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import * as jose from 'jose';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const body = await req.json();
    const {email, password} = body;
    if(!email || !password){
        return NextResponse.json({message: 'All required fields are mandatory'}, {status: 400});
    }
    const user = await db.collection('users').findOne({email}, {projection: {_id: 1, name: 1,password: 1}});
    
    if(!user){
        return NextResponse.json({message: 'User does not exist'}, {status: 400});
    }
    
    const match = await bcrypt.compare(password, user["password"]);
    if(!match){
        return NextResponse.json({message: 'Invalid credentials'}, {status: 400});
    }

    const secret = jose.base64url.decode(await process.env.SECRET || '')
    const jwt = await new jose.CompactSign(
            new TextEncoder().encode(JSON.stringify({ user_id: user["_id"], name: user["name"], email: email, iat: Math.floor(Date.now() / 1000) }))
        )
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
    return NextResponse.json({access_token: jwt, message: 'User created successfully'}, {status: 201});
}
