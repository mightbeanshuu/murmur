import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateMcpToken } from "@/lib/mcp/service";
import { createMurmurMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";

function readBearerToken(request: Request) {
  const match = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

function unauthorized() {
  return Response.json(
    { error: "A valid Murmur MCP bearer token is required." },
    {
      status: 401,
      headers: {
        "cache-control": "no-store",
        "www-authenticate": 'Bearer realm="Murmur MCP"',
      },
    },
  );
}

async function handleMcp(request: Request) {
  const token = readBearerToken(request);
  if (!token) return unauthorized();

  const account = await authenticateMcpToken(token);
  if (!account) return unauthorized();

  const publicUrl = new URL(process.env.APP_URL ?? request.url);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    allowedHosts: [publicUrl.host],
    allowedOrigins: [publicUrl.origin],
    enableDnsRebindingProtection: true,
  });
  const server = createMurmurMcpServer(account.userId);
  await server.connect(transport);
  return transport.handleRequest(request);
}

export const GET = handleMcp;
export const POST = handleMcp;
export const DELETE = handleMcp;
