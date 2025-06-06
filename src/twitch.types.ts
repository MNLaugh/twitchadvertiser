export type User = {
  id: string,
  login: "twitchdev",
  display_name: "TwitchDev",
  type: "",
  broadcaster_type: "partner",
  description: "Supporting third-party developers building Twitch integrations from chatbots to game integrations.",
  profile_image_url: "https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-300x300.png",
  view_count: 5980557,
}

export type Stream = {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  tags: string[];
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tags_ids: string[];
  is_mature: boolean;
}