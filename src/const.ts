function getEnv(str: string): string {
  const e = Deno.env.get(str);
  if (!e) throw new Error("Env undefined: " + str);
  return e;
}

export const clientId = getEnv("CLIENT_ID");
export const clientSecret = getEnv("CLIENT_SECRET");
export const access_token = getEnv("ACCESS_TOKEN");
export const refresh_token = getEnv("REFRESH_TOKEN");
export const userclientId = getEnv("USER_CLIENT_ID");
export const streamerLogin = "tontonours34";
export const socketUrl = "wss://eventsub.wss.twitch.tv/ws";
export const n8nwh = getEnv("N8N_WH");
export const n8nwh_test = getEnv("N8N_WH_TEST");