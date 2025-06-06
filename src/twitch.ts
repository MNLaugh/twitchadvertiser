import {
  clientId,
  clientSecret,
  userclientId,
  access_token
} from "./const.ts";

import { Stream, User } from "./twitch.types.ts";

import { logger } from "./utils.ts";

export async function getOAuthToken(): Promise<string> {
  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  if (!data.access_token) throw new Error("Impossible d'obtenir le token OAuth");
  return data.access_token;
}

export async function getUserId(login: string): Promise<string> {
  const res = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
    headers: {
      "Authorization": `Bearer ${await getOAuthToken()}`,
      "Client-Id": clientId
    }
  });
  const data = await res.json();
  if (!data.data || data.data.length === 0) throw new Error(`Aucun utilisateur trouvé pour le login "${login}"`);
  return data.data[0].id;
}

export async function getStreamers(logins: string[]): Promise<User[]> {
  const params = logins.map((login, i): string => {
    if (i===0) return `?login=${login}`;
    else return `&login=${login}`;
  }).join("");
  const res = await fetch(`https://api.twitch.tv/helix/users${params}`, {
    headers: {
      "Client-Id": userclientId,
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    }
  });
  const data = await res.json();
  if (res.status !== 200) throw new Error("User infos error, " + JSON.stringify(data));
  if (!data.data || data.data.length === 0) throw new Error(`No user found for login "${logins.toString()}"`);
  return data.data as User[];
}


export async function getStreamDetails(userId: string): Promise<Stream> {
  const res = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
    headers: {
      "Client-Id": userclientId,
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (res.status !== 200) throw new Error("Stream details error, " + JSON.stringify(data));
  if (data.data && data.data.length > 0) {
    const stream = data.data[0];
    stream.thumbnail_url = stream.thumbnail_url.replace("{width}x{height}", "640x360");
    // const streamer = await getStreamer(stream.user_name);
    // stream.streamer = streamer
    // console.log("🎯 Stream title:", stream.title);
    // console.log("🎮 Game/category:", stream.game_name);
    // console.log("🌍 Language:", stream.language);
    // console.log("👥 Viewers:", stream.viewer_count);
    // console.log("📸 Thumbnail:", stream.thumbnail_url);
    return stream as Stream;
  } else {
    logger.error("❌ No stream found (maybe it's already offline?), retry in 5s...");
    await new Promise(r => setTimeout(r, 5000));
    return await getStreamDetails(userId);
  }
}

// deno-lint-ignore no-explicit-any
export async function validateAccessToken(): Promise<{ validToken: boolean, data: any }> {
  const res = await fetch("https://id.twitch.tv/oauth2/validate", {
    method: "GET",
    headers: {
      "Authorization": `OAuth ${access_token}`
    }
  });
  const data = await res.json();
  return { validToken: (res.status === 200), data };
}

export type SubscriptionType = "stream.online" | "stream.offline";
export type SubscriptionCondition = { broadcaster_user_id: string };
export async function subscribeToStream(
  type: SubscriptionType,
  condition: SubscriptionCondition,
  session_id: string
): Promise<void> {
  const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      "Client-Id": userclientId,
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type,
      version: "1",
      condition,
      transport: { method: "websocket", session_id }
    })
  }).catch(error => {
    throw error;
  });
  const result = await res.json();
  if (!res.ok) throw new Error(`🚨🚨 Subscribe to ${type} failed with this details: ${JSON.stringify(result)}`);
  const sessionId = localStorage.getItem("SESSION_ID");
  if (!sessionId) throw new Error(`🚨🚨 Subscribe to ${type} failed with this details: SESSION_ID undefined`);
  if (sessionId !== result.data[0].transport.session_id) throw new Error("The session ID is not the same as the subscription");
}