import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';

export async function middleware(req: NextRequest){
    const auth_token = req.headers.get('Authorization');
    if (auth_token == null){
        return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
    const token = auth_token.replace(/^Bearer\s+/, '');
    try {
        const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.SECRET || ''))
        const userid = String(payload['user_id']);
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('user_id', userid);
        return NextResponse.next({
            request: {
            headers: requestHeaders,
            },
        });
    } catch{
        return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
}

export const config = {
    matcher: ['/api/v1/:path*']
}