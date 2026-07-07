import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { telegramMessageInputSchema } from "./core/schemas";
import { sendTelegramMessage } from "./core/operations";

export function createMcpServer() {
  const server = new McpServer({
    name: "progenye-mentor",
    version: "0.1.0",
  });

  server.registerTool(
    "telegram",
    {
      title: "Telegram",
      description: "Send a Telegram message.",
      inputSchema: telegramMessageInputSchema.shape,
    },
    async (input) => {
      const result = await sendTelegramMessage({
        ...input,
        botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
      });

      return {
        content: [
          {
            type: "text",
            text: `Sent Telegram message ${result.messageId} to chat ${result.chatId}`,
          },
        ],
      };
    },
  );

  return server;
}
