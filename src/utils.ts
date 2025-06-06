import { n8nwh, n8nwh_test } from "./const.ts";
import { Stream, User } from "./twitch.types.ts";
import Logger from "./logger.ts";
export const logger = Logger.create({ prefix: "[Twitch api] =>" });
export const delay = (ms: number): Promise<unknown> => new Promise(r => setTimeout(r, ms));
export async function triggern8n(type:string, stream: Stream): Promise<void> {
  const response = await fetch(n8nwh_test, {
    method: "POST",
    headers: {
      "n8n": "tonton",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type,
      stream,
      streamer: JSON.parse(localStorage.getItem(`user-${stream.user_id}`)!) as User
    })
  });
  const result = await response.text();
  logger.info("✅ Réponse n8n :", result);
}