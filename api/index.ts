import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createClerkClient } from "@clerk/backend";
import { generateClerkProtectedResourceMetadata } from "@clerk/mcp-tools/server";
import { createMcpServer } from "../src/server";

const app = express();
app.use(express.json());

const clerkClient = createClerkClient({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
});

function unauthorized(res: express.Response, botToken: string, req: express.Request) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const resourceUrl = `${baseUrl}/.well-known/oauth-protected-resource/${botToken}/mcp`;
  res.setHeader("WWW-Authenticate", `Bearer resource_metadata="${resourceUrl}"`);
  res.status(401).json({ error: "Unauthorized" });
}

app.get("/.well-known/oauth-protected-resource/:botToken/mcp", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const resourceUrl = `${baseUrl}/${req.params.botToken}/mcp`;

  res.json(
    generateClerkProtectedResourceMetadata({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
      resourceUrl,
    }),
  );
});

app.all("/:botToken/mcp", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized(res, req.params.botToken, req);
  }

  try {
    const requestState = await clerkClient.authenticateRequest(req as any, {
      acceptsToken: "oauth_token",
    });

    if (!requestState.isAuthenticated) {
      return unauthorized(res, req.params.botToken, req);
    }
  } catch {
    return unauthorized(res, req.params.botToken, req);
  }

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  try {
    await transport.handleRequest(req as any, res as any);
  } finally {
    await server.close();
  }
});

app.all("/mcp", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const requestState = await clerkClient.authenticateRequest(req as any, {
      acceptsToken: "oauth_token",
    });

    if (!requestState.isAuthenticated) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  try {
    await transport.handleRequest(req as any, res as any);
  } finally {
    await server.close();
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app as unknown as import("express").Express;
