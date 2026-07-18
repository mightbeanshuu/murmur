import { getRequestSession } from "@/lib/auth";
import { getMcpTokenStatus, issueMcpToken, revokeMcpToken } from "@/lib/mcp/service";

export const runtime = "nodejs";

function noStore(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(body, { ...init, headers });
}

async function authenticatedUser(request: Request) {
  const session = await getRequestSession(request);
  return session?.user.id ?? null;
}

function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(process.env.APP_URL ?? request.url).origin;
}

export async function GET(request: Request) {
  const userId = await authenticatedUser(request);
  if (!userId) return noStore({ error: "Authentication required." }, { status: 401 });

  const status = await getMcpTokenStatus(userId);
  return noStore({
    ...status,
    createdAt: status.createdAt?.toISOString() ?? null,
    lastUsedAt: status.lastUsedAt?.toISOString() ?? null,
  });
}

export async function POST(request: Request) {
  const userId = await authenticatedUser(request);
  if (!userId) return noStore({ error: "Authentication required." }, { status: 401 });
  if (!hasTrustedOrigin(request)) return noStore({ error: "Origin not allowed." }, { status: 403 });

  const issued = await issueMcpToken(userId);
  return noStore(
    { token: issued.token, prefix: issued.prefix, createdAt: issued.createdAt.toISOString() },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const userId = await authenticatedUser(request);
  if (!userId) return noStore({ error: "Authentication required." }, { status: 401 });
  if (!hasTrustedOrigin(request)) return noStore({ error: "Origin not allowed." }, { status: 403 });

  await revokeMcpToken(userId);
  return noStore({ ok: true });
}
