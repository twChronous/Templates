import { type JWTPayload, SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
	process.env.JWT_SECRET || "secretofodao",
);

export async function jwtSign(
	payload: JWTPayload,
	expiresInMinutes: number,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt(now)
		.setExpirationTime(now + expiresInMinutes * 60)
		.sign(secret);
}

export async function jwtVerifyToken(token: string) {
	const { payload } = await jwtVerify(token, secret);
	return payload;
}
