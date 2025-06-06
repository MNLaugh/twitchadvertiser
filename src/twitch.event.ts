import {
  logger,
  delay,
  triggern8n
} from "./utils.ts";

import {
  validateAccessToken,
  getStreamers,
  getStreamDetails,
  subscribeToStream,
} from "./twitch.ts";

import {
  socketUrl
} from "./const.ts";
import { Stream } from "./twitch.types.ts";

const { validToken, data } = await validateAccessToken();
if (validToken) {
  logger.info("✅ User access token is valid !");
  logger.info("👥 Login as: " + data.login);
} else {
  logger.error("❌ User access token is NOT valid, or expired !");
  throw new Error(data);
}

const streamerLogins = ["mnlaugh", "tontonours34"];
const streamers = await getStreamers(streamerLogins);
if (streamers.length === 0) throw new Error("No streamers could be recovered, help!");
streamers.forEach(streamer => localStorage.setItem(streamer.id, JSON.stringify(streamer)));
logger.info(`🗃️  Store ${streamers.length} streamers saved in local storage: ${streamerLogins.toString()}`);

let dataInterval: number;
function connectWebSocket(): void {
  const ws = new WebSocket(socketUrl);
  ws.onopen = (): void => {
    logger.info("🔌 WebSocket plugged in! Awaiting session_welcome 📶");
  };

  ws.onmessage = async (event): Promise<void> => {
    const data = JSON.parse(event.data);

    if (data.metadata?.message_type === "session_welcome") {
      const sessionId = data.payload.session.id;
      localStorage.setItem("SESSION_ID", sessionId);
      logger.info(`🎉 Boom! WebSocket session is live: ${sessionId}`);

      streamers.forEach(async streamer => {
        await subscribeToStream("stream.online", { broadcaster_user_id: streamer.id }, sessionId).catch(error => logger.error(error));
        logger.info(`✅ Subscribe to Online event 🎉 (Subscription to broadcaster: ${streamer.display_name})`);

        await subscribeToStream("stream.offline", { broadcaster_user_id: streamer.id }, sessionId).catch(error => logger.error(error));
        logger.info(`✅ Subscribe to Offline event 🎉 (Subscription to broadcaster: ${streamer.display_name})`);
      })

    } else if (data.metadata?.message_type === "notification") {
      if (data.payload.subscription.type === "stream.online") {
        const { broadcaster_user_id, broadcaster_user_name } = data.payload.event;
        await delay(2000);
        const stream = {...await getStreamDetails(broadcaster_user_id), broadcaster_user_name };
        logger.info("📢 stream online détected for " + broadcaster_user_name, stream);
        localStorage.setItem(broadcaster_user_id, JSON.stringify(stream));
        await triggern8n(data.payload.subscription.type, stream);
        dataInterval = setInterval( async (): Promise<void> => {
          const dataStream = {...await getStreamDetails(broadcaster_user_id), broadcaster_user_name };
          localStorage.setItem(broadcaster_user_id, JSON.stringify(dataStream));
          logger.info("🗃️  Store stream data updated")
        }, 60000);
      } else if (data.payload.subscription.type === "stream.offline") {
        const { broadcaster_user_id, broadcaster_user_name } = data.payload.event;
        logger.info("📢 stream détected for " + broadcaster_user_name);
        const streamStored = localStorage.getItem(broadcaster_user_id);
        if (streamStored) {
          const stream = JSON.parse(streamStored) as Stream;
          await triggern8n(data.payload.subscription.type, stream);
          clearInterval(dataInterval)
        }
      }
    } else if (data.metadata?.message_type === "session_keepalive") {
      logger.debug("⏳ Keepalive, " + new Date(data.metadata.message_timestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    }
  };

  ws.onclose = (): void => {
    logger.warn("🔄 WebSocket closed. Attempting to reconnect...");
    setTimeout((): void => connectWebSocket(), 5000);
  };

  ws.onerror = (error): void => {
    logger.warn("🚨 WebSocket encountered an error. Reconnecting in 5s...");
    logger.error(error);
    setTimeout((): void => connectWebSocket(), 5000);
  };
}

async function main(): Promise<void> {
  try {
    await connectWebSocket();
  } catch (err) {
    logger.error("💥 Fatal error in main():", err);
  }
}

main();
