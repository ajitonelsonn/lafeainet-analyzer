// lib/db.ts
import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: true,
  },
};

export async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
}
