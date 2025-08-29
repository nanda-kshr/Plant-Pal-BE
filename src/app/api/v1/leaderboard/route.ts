import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/db";
export async function GET(req: NextRequest){
    const client = clientPromise;
    const db = client.db('plant_pal')
    const topUsers = await db.collection("plants").aggregate([
        { $group: { _id: "$user_id", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { _id: 1, count: 1, name: "$user.name" } }
    ]).toArray();

    return NextResponse.json({topUsers: topUsers }, { status: 200 });
}
