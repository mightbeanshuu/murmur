import { betterAuth } from "better-auth";
import { database } from "./database";

export const auth = betterAuth({
  appName: "Murmur",
  database,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type AuthSession = typeof auth.$Infer.Session;

export async function getRequestSession(req: Request) {
  return auth.api.getSession({ headers: req.headers });
}
