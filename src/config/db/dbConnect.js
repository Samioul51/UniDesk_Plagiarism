import { neon } from "@neondatabase/serverless";

export const sql=neon(process.env.DATABASE_URL);

export const connectDB=async ()=>{
    try{
        await sql`select 1`;
        console.log("Neon PostgreSQL connected");
    } catch(error){
        console.log("Database connection failed",error.message);
        throw error;
    }
};


