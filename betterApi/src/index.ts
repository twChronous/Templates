import { Elysia } from "elysia";

import { LOG } from "./utils/logger";
import { AuthService } from "./services/auth.service";
import { SessionService } from "./services/session.service";
import { wafProtection } from "./middlewares/waf.middleware";

const app = new Elysia();
const authService = new AuthService();
const sessionService = new SessionService();

app
	.onBeforeHandle((req) => wafProtection(req))
	.post("/login", async (req) => authService.login(req))
	.post("/logout", async (req) => authService.logout(req))
	.post("/logout-all", async (req) => authService.logoutAll(req))
	.post("/register", async (req) => authService.createAccount(req))
	.post("/refresh-token", async (req) => authService.refreshToken(req))
	.get("/me", async (req) => authService.me(req))
	.get("/sessions", async (req) => sessionService.listSessions(req))
	.delete("/sessions/:id", async (req) => sessionService.logoutSession(req))
	.delete("/sessions", async (req) => sessionService.logoutAll(req))
	.listen(3000);

LOG("🚀 Server rodando", "http://localhost:3000");
