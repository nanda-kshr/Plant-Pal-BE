import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

type Duration = {
	unit: string;
	value: number;
}

type Interval = {
	time: string;
	duration: Duration;
}

const ALLOWED_MODULES = ["water", "soil-moisture"];
const ALLOWED_UNITS = new Set(["second", "minute"]);

type ConvertedInterval = {
	time: Date;
	duration: Duration;
}

export async function POST(req: NextRequest){
	const client = clientPromise;
	const db = client.db('plant_pal')

	const userIdHeader = req.headers.get("user_id") || '';
	if (!ObjectId.isValid(userIdHeader)) return NextResponse.json({message: 'Invalid user_id'}, {status: 400});
	const user_id = new ObjectId(userIdHeader);

	const body = await req.json();
	const { module, intervals, plant_id } : { module?: string, intervals?: Interval[], plant_id?: string } = body || {};

	if (!plant_id || typeof plant_id !== 'string' || !ObjectId.isValid(plant_id)) return NextResponse.json({message: 'Invalid or missing plant_id'}, {status: 400});
	const plantObjectId = new ObjectId(plant_id);

	if (!module || typeof module !== 'string' || !ALLOWED_MODULES.includes(module)){
		return NextResponse.json({message: "Invalid module. Must be 'water' or 'soil-moisture'"}, {status: 400});
	}

	if (!Array.isArray(intervals) || intervals.length === 0){
		return NextResponse.json({message: 'intervals must be a non-empty array'}, {status: 400});
	}

	const converted: ConvertedInterval[] = [];
	for (let i = 0; i < intervals.length; i++){
		const it = intervals[i];
		if (!it || typeof it !== 'object') return NextResponse.json({message: `interval at index ${i} is invalid`}, {status: 400});
		const { time, duration } = it as Interval;
		if (!time || typeof time !== 'string') return NextResponse.json({message: `time is required for interval at index ${i}`}, {status: 400});
		const parsed = new Date(time);
		if (isNaN(parsed.getTime())) return NextResponse.json({message: `time at index ${i} is not a valid date/time (expected ISO/Mongo format)`}, {status: 400});

		if (!duration || typeof duration !== 'object') return NextResponse.json({message: `duration is required for interval at index ${i}`}, {status: 400});
		const { unit, value } = duration as Duration;
		if (!unit || typeof unit !== 'string' || !ALLOWED_UNITS.has(unit)) return NextResponse.json({message: `duration.unit at index ${i} must be one of ${Array.from(ALLOWED_UNITS).join(', ')}`}, {status: 400});
		if (typeof value !== 'number' || value <= 0) return NextResponse.json({message: `duration.value at index ${i} must be a positive number`}, {status: 400});

		converted.push({ time: parsed, duration: { unit, value } });
	}

	try{
		const exists = await db.collection('plants').findOne({_id: plantObjectId, user_id});
		if(!exists) return NextResponse.json({message: 'Plant does not exist or is not owned by the user'}, {status: 400});
        await db.collection('plants').updateOne({_id: plantObjectId, user_id}, { $set: { [module]: converted } });
		return NextResponse.json({ message: 'Schedule saved successfully' }, { status: 200 });
	}catch(err){
		console.error('set-time error', err);
		return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
	}
}

