import type { NextRequest } from "next/server";
import { proxyGatewayJSON } from "../../_lib/gateway-proxy";

export async function POST(request: NextRequest) {
  return proxyGatewayJSON(request, "/api/risk/plan");
}
