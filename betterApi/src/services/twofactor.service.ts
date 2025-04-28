import QRCode from "qrcode";
import { authenticator } from "otplib";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_ANON_KEY!,
);

export class TwoFactorService {
	generateSecret(userEmail: string) {
		const secret = authenticator.generateSecret();
		const otpauth = authenticator.keyuri(userEmail, "MinhaAppTopzera", secret);
		return { secret, otpauth };
	}

	async generateQRCode(otpauth: string) {
		return await QRCode.toDataURL(otpauth);
	}

	verifyToken(secret: string, token: string) {
		return authenticator.verify({ token, secret });
	}

	async activate2FA(userId: string, token: string) {
		const { data: user } = await supabase
			.from("users")
			.select("twofa_secret")
			.eq("id", userId)
			.single();

		if (!user || !user.twofa_secret) {
			throw new Error("Chave 2FA não gerada.");
		}

		const valid = this.verifyToken(user.twofa_secret, token);

		if (!valid) {
			throw new Error("Token inválido.");
		}

		await supabase
			.from("users")
			.update({ twofa_enabled: true })
			.eq("id", userId);

		return true;
	}

	async deactivate2FA(userId: string) {
		await supabase
			.from("users")
			.update({ twofa_enabled: false, twofa_secret: null })
			.eq("id", userId);

		return true;
	}
}
