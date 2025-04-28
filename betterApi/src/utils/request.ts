export const getIp = (req: any) =>
	req.headers["x-forwarded-for"] || req.ip || "desconhecido";

export const getUserAgent = (req: any) =>
	req.headers["user-agent"] || "desconhecido";
