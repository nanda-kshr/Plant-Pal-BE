import { MongoClient } from 'mongodb';

declare global {
  var _promiseClientConnection: MongoClient | undefined;
}

const MONGODB_URI = process.env.MONGO_URI || "";

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGO_URI environment variable inside .env.local'
  );
}

let clientPromise: MongoClient;

if(process.env.NODE_ENV == "development"){
  if(!global._promiseClientConnection){
    global._promiseClientConnection = new MongoClient(MONGODB_URI);
  }
  clientPromise = global._promiseClientConnection!;
}else{
  clientPromise = new MongoClient(MONGODB_URI);
}

export default clientPromise;