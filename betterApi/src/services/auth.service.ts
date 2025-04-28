import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

import { LOG, LOG_ERR } from "../utils/logger";
import { jwtSign, jwtVerifyToken } from "../utils/jwt";
import { getIp, getUserAgent } from "../utils/request";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { AuthGuardService } from "../services/auth-guard.service";
import { TwoFactorService } from "../services/twofactor.service";

const twoFactor = new TwoFactorService();
const authGuard = new AuthGuardService();

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_ANON_KEY!,
);

export class AuthService {
	async login(req: any) {
		const blocked = await authGuard.checkBlocked(req);
		if (blocked) return blocked;

		const body = req.body;
		const data = loginSchema.parse(body);

		// Busca o usuário no banco de dados
		const { data: user, error } = await supabase
			.from("users")
			.select("*")
			.eq("email", data.email)
			.single();
		const verifyPass = await bcrypt.compare(data.password, user.password);

		if (!user || error || !verifyPass) {
			// Registra falha se as credenciais estiverem erradas
			await authGuard.registerFailedAttempt(req);
			return new Response("Credenciais inválidas", { status: 401 });
		}

		const ip = getIp(req);
		const userAgent = getUserAgent(req);
		await authGuard.resetFailedAttempts(req);

		// Verifica se o 2FA está habilitado para o usuário
		if (user.twofa_enabled) {
			const { secret, otpauth } = twoFactor.generateSecret(user.email);

			// Salva a chave secreta do 2FA no banco de dados
			await supabase
				.from("users")
				.update({ twofa_secret: secret })
				.eq("id", user.id);

			// Gera o QRCode e envia ao cliente
			const qrCode = await twoFactor.generateQRCode(otpauth);
			LOG("Usuario logado com 2FA", user.email, "SUCESSO");
			return new Response(JSON.stringify({ qrCode }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Criação da sessão após login bem-sucedido
		const { data: session } = await supabase
			.from("sessions")
			.insert([
				{
					user_id: user.id,
					ip_address: ip,
					user_agent: userAgent,
					is_active: true,
				},
			])
			.select()
			.single();

		// Geração do AccessToken e RefreshToken
		const accessToken = await jwtSign(
			{ userId: user.id, sessionId: session.id },
			15,
		);
		const refreshToken = await jwtSign(
			{ userId: user.id, sessionId: session.id },
			data.rememberMe ? 43200 : 10080,
		);

		// Criação da resposta com os cookies de acesso
		const res = new Response("Logado com sucesso!", { status: 200 });

		const now = new Date();
		now.setSeconds(now.getSeconds() + 60 * 15); // 15 minutos para o accessToken

		res.headers.set(
			"Set-Cookie",
			`accessToken=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${now.toUTCString()};`,
		);

		const refreshNow = new Date();
		refreshNow.setSeconds(
			refreshNow.getSeconds() +
				(data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7),
		); // Dependendo do "rememberMe"

		res.headers.append(
			"Set-Cookie",
			`refreshToken=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${refreshNow.toUTCString()};`,
		);

		return res;
	}
	async createAccount(req: any) {
		const body = req.body;
		const data = registerSchema.parse(body);

		// Verifica se o e-mail já está registrado
		const { data: existingUser, error } = await supabase
			.from("users")
			.select("*")
			.eq("email", data.email)
			.single();

		if (existingUser) {
			LOG_ERR("E-mail já registrado", "ERRO");
			return new Response("Este e-mail já está em uso", { status: 400 });
		}

		// Cria o usuário no banco de dados
		const { data: user, error: userError } = await supabase
			.from("users")
			.insert([
				{
					name: data.name,
					email: data.email,
					password: await bcrypt.hash(data.password, 10), // Aqui você pode fazer hash da senha antes de salvar (por exemplo, usando bcrypt)
					twofa_enabled: data.twofaEnabled || false, // Se 2FA está habilitado ou não
				},
			])
			.select()
			.single();

		if (userError! || !user) {
			LOG_ERR("Erro ao criar usuário", userError?.message!);
			return new Response("Erro ao criar a conta", { status: 500 });
		}

		// Se o 2FA está habilitado, geramos o segredo e o QRCode
		if (data.twofaEnabled) {
			const { secret, otpauth } = twoFactor.generateSecret(data.email);

			// Salva a chave secreta do 2FA no banco de dados
			await supabase
				.from("users")
				.update({ twofa_secret: secret })
				.eq("id", user.id);

			// Gera o QRCode
			const qrCode = await twoFactor.generateQRCode(otpauth);
			LOG("Conta criada com 2FA", user.email, "SUCESSO");
			return new Response(
				JSON.stringify({
					message: "Conta criada com sucesso! Configure o 2FA",
					qrCode,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		LOG("Conta criada", user.email, "SUCESSO");
		return new Response("Conta criada com sucesso!", { status: 200 });
	}
	async refreshToken(req: any) {
		const cookies = req.headers["set-cookie"] || "";
		const refreshToken = this.extractCookie(cookies, "refreshToken");

		if (!refreshToken) {
			return new Response("Refresh token obrigatório", { status: 400 });
		}

		let payload;
		try {
			payload = await jwtVerifyToken(refreshToken);
		} catch {
			return new Response("Token inválido", { status: 401 });
		}

		const { data: session, error } = await supabase
			.from("sessions")
			.select("*")
			.eq("id", payload.sessionId)
			.eq("is_active", true)
			.single();

		if (!session || error) {
			return new Response("Sessão inválida", { status: 401 });
		}

		const newAccessToken = await jwtSign(
			{ userId: payload.userId, sessionId: payload.sessionId },
			15,
		);
		const res = new Response("Token atualizado", { status: 200 });

		const now = new Date();
		now.setSeconds(now.getSeconds() + 60 * 15);

		res.headers.set(
			"Set-Cookie",
			`accessToken=${newAccessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${now.toUTCString()}`,
		);

		return res;
	}

	async logout(req: any) {
		const cookies = req.headers["set-cookie"] || "";
		const accessToken = this.extractCookie(cookies, "accessToken");

		if (!accessToken) {
			return new Response("Token obrigatório", { status: 400 });
		}

		let payload;
		try {
			payload = await jwtVerifyToken(accessToken);
		} catch {
			return new Response("Token inválido", { status: 401 });
		}

		await supabase
			.from("sessions")
			.update({ is_active: false })
			.eq("id", payload.sessionId);

		const res = new Response("Deslogado com sucesso!", { status: 200 });

		res.headers.set(
			"Set-Cookie",
			`accessToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`,
		);
		res.headers.append(
			"Set-Cookie",
			`refreshToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`,
		);

		return res;
	}

	async logoutAll(req: any) {
		const cookies = req.headers["set-cookie"] || "";
		const accessToken = this.extractCookie(cookies, "accessToken");

		if (!accessToken) {
			return new Response("Token obrigatório", { status: 400 });
		}

		let payload;
		try {
			payload = await jwtVerifyToken(accessToken);
		} catch {
			return new Response("Token inválido", { status: 401 });
		}

		await supabase
			.from("sessions")
			.update({ is_active: false })
			.eq("user_id", payload.userId);

		const res = new Response("Deslogado de todos os dispositivos!", {
			status: 200,
		});

		res.headers.set(
			"Set-Cookie",
			`accessToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`,
		);
		res.headers.append(
			"Set-Cookie",
			`refreshToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`,
		);

		return res;
	}

	async me(req: any) {
		const cookies = req.headers["set-cookie"] || "";
		const accessToken = this.extractCookie(cookies, "refreshToken");

		if (!accessToken) {
			return new Response("Não autenticado", { status: 401 });
		}

		let payload;
		try {
			payload = await jwtVerifyToken(accessToken);
		} catch {
			return new Response("Token inválido", { status: 401 });
		}

		const ip = getIp(req);
		const userAgent = getUserAgent(req);

		return new Response(
			JSON.stringify({
				userId: payload.userId,
				sessionId: payload.sessionId,
				ip,
				userAgent,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	private extractCookie(cookies: string, name: string): string | undefined {
		const cookieArr = String(cookies)
			.split(";")
			.map((c) => c.trim());
		for (const cookie of cookieArr) {
			if (cookie.startsWith(name + "=")) {
				return cookie.split("=")[1];
			}
		}
		return undefined;
	}
}
