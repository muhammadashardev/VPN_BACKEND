import { NextResponse } from "next/server";
import { VPN_SERVERS } from "@/lib/constants";

export async function GET() {
  return NextResponse.json(VPN_SERVERS);
}
