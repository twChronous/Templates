import { getIp, getUserAgent } from "../utils/request";

const blockedIps = new Set<string>([
	"123.123.123.123", // exemplo
]);

const blockedUserAgents = ["curl", "wget", "python-requests"];

export function wafProtection(req: any): Response | undefined {
	const ip = getIp(req);
	const userAgent = getUserAgent(req).toLowerCase();

	if (blockedIps.has(ip)) {
		return new Response("Acesso negado", { status: 403 });
	}

	if (blockedUserAgents.some((ua) => userAgent.includes(ua))) {
		return new Response("Bot detectado", { status: 403 });
	}

	if (!userAgent) {
		return new Response("User-Agent vazio não permitido", { status: 403 });
	}

	return undefined; // Liberado
}
