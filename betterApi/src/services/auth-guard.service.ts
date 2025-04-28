import { createClient } from "@supabase/supabase-js";

import { getIp } from "../utils/request";
import { LOG_ERR } from "../utils/logger";

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_ANON_KEY!,
);

export class AuthGuardService {
	private maxAttempts = 5;
	private blockDurationMinutes = 15;

	async checkBlocked(req: any): Promise<Response | undefined> {
		const ip = getIp(req);

		const { data, error } = await supabase
			.from("failed_logins")
			.select("*")
			.eq("ip_address", ip)
			.single();

		if (!data || error) return undefined;

		const lastAttempt = new Date(data.last_attempted);
		const now = new Date();
		const diffMinutes = Math.abs(
			Math.floor((now.getTime() - lastAttempt.getTime()) / (1000 * 60)),
		);

		if (
			data.attempts >= this.maxAttempts &&
			diffMinutes < this.blockDurationMinutes
		) {
			LOG_ERR(
				"IP bloqueado",
				`${ip}, ${data.attempts + 1}, ${diffMinutes.toFixed(2)} minutos`,
			);
			return new Response("IP bloqueado. Tente novamente depois.", {
				status: 429,
			});
		}

		if (diffMinutes >= this.blockDurationMinutes) {
			// Resetar tentativas depois do tempo
			await supabase.from("failed_logins").delete().eq("ip_address", ip);
		}

		return undefined;
	}

	async registerFailedAttempt(req: any): Promise<void> {
		const ip = getIp(req);

		const { data } = await supabase
			.from("failed_logins")
			.select("*")
			.eq("ip_address", ip)
			.single();

		if (!data) {
			await supabase
				.from("failed_logins")
				.insert([{ ip_address: ip, attempts: 1 }]);
		} else {
			await supabase
				.from("failed_logins")
				.update({
					attempts: data.attempts + 1,
					last_attempted: new Date().toISOString(),
				})
				.eq("ip_address", ip);
		}
	}

	async resetFailedAttempts(req: any): Promise<void> {
		const ip = getIp(req);

		await supabase.from("failed_logins").delete().eq("ip_address", ip);
	}
}
