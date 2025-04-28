import { createClient } from "@supabase/supabase-js";

import { jwtVerifyToken } from "../utils/jwt";

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_ANON_KEY!,
);

export class SessionService {
	// Cookie-based authentication method
	async authenticate(req: any) {
		// Extract session cookie
		const sessionCookie = getCookie(req, "accessToken");

		if (!sessionCookie) {
			throw new Error("Sem sessão");
		}

		try {
			// Verify the cookie/token
			const payload = await jwtVerifyToken(sessionCookie);

			// Validate session in database
			const { data: session, error } = await supabase
				.from("sessions")
				.select("*")
				.eq("id", payload.sessionId)
				.eq("is_active", true)
				.single();

			if (!session || error) {
				throw new Error("Sessão inválida");
			}

			return payload;
		} catch (error) {
			throw new Error("Autenticação falhou");
		}
	}

	async listSessions(req: any) {
		const user = await this.authenticate(req);

		const { data } = await supabase
			.from("sessions")
			.select("*")
			.eq("user_id", user.userId)
			.eq("is_active", true);

		return new Response(JSON.stringify(data), {
			headers: {
				"Content-Type": "application/json",
				// Add CORS headers if needed
				"Access-Control-Allow-Credentials": "true",
			},
		});
	}

	async logoutSession(req: any) {
		const user = await this.authenticate(req);
		const sessionId = req.params.id;

		await supabase
			.from("sessions")
			.update({ is_active: false })
			.eq("id", sessionId)
			.eq("user_id", user.userId);

		// Clear the specific session cookie
		return new Response("Sessão encerrada", {
			status: 200,
			headers: {
				"Set-Cookie": `session_token=${sessionId}; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`,
			},
		});
	}

	async logoutAll(req: any) {
		const user = await this.authenticate(req);

		await supabase
			.from("sessions")
			.update({ is_active: false })
			.eq("user_id", user.userId)
			.neq("id", user.sessionId);

		// Clear all session cookies
		return new Response("Todas as outras sessões encerradas", {
			status: 200,
			headers: {
				"Set-Cookie": `session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`,
			},
		});
	}
}

// Utility function for cookie parsing (you'll need to implement this)
function getCookie(req: any, name: string): string | null {
	const cookieHeader = req.headers["cookie"] || "";
	const cookies = cookieHeader.split("; ");

	for (const cookie of cookies) {
		const [cookieName, cookieValue] = cookie.split("=");
		if (cookieName === name) {
			return cookieValue;
		}
	}

	return null;
}

// Enhanced cookie utility (you can expand this)
export function setCookie(
	res: Response,
	name: string,
	value: string,
	options: {
		httpOnly?: boolean;
		secure?: boolean;
		sameSite?: "Strict" | "Lax" | "None";
		maxAge?: number;
		path?: string;
	} = {},
) {
	const {
		httpOnly = true,
		secure = true,
		sameSite = "Strict",
		maxAge = 24 * 60 * 60, // 24 hours
		path = "/",
	} = options;

	const cookieOptions = [
		`${name}=${value}`,
		`Path=${path}`,
		`Max-Age=${maxAge}`,
		httpOnly ? "HttpOnly" : "",
		secure ? "Secure" : "",
		`SameSite=${sameSite}`,
	]
		.filter(Boolean)
		.join("; ");

	res.headers.append("Set-Cookie", cookieOptions);
	return res;
}
