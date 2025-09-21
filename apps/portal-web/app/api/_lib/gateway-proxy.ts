import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
const GATEWAY_API_KEY = process.env.PORTAL_GATEWAY_API_KEY;

function buildTargetUrl(path: string): string {
  if (!path.startsWith("/")) {
    return `${GATEWAY_BASE_URL}/${path}`;
  }
  return `${GATEWAY_BASE_URL}${path}`;
}

async function readRequestBody(request: NextRequest): Promise<string | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const clone = request.clone();
  const text = await clone.text();
  return text.length > 0 ? text : undefined;
}

export async function proxyGatewayJSON(request: NextRequest, path: string): Promise<NextResponse> {
  try {
    const body = await readRequestBody(request);
    const upstream = await fetch(buildTargetUrl(path), {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        ...(GATEWAY_API_KEY ? { "X-API-Key": GATEWAY_API_KEY } : {}),
      },
      body,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const text = await upstream.text();

    if (!contentType.includes("application/json")) {
      return new NextResponse(text, {
        status: upstream.status,
        headers: { "Content-Type": contentType },
      });
    }

    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: upstream.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gateway request failed";
    return NextResponse.json(
      {
        error: "gateway_proxy_error",
        message,
      },
      { status: 502 }
    );
  }
}
