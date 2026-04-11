import { NextResponse } from "next/server";

export async function GET() {
  // Simulate a random status for the demo
  const statuses = ["online", "high-load", "maintenance"];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return NextResponse.json({
    status: "healthy",
    global_load: Math.floor(Math.random() * 100),
    active_users: Math.floor(Math.random() * 10000),
    system_status: status
  });
}
