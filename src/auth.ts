// Importer le module dotenv
import { load } from "https://deno.land/std@0.200.0/dotenv/mod.ts";

// Charger les variables d'environnement depuis le fichier .env
const env = await load();

// Accéder aux variables d'environnement
const clientId = env["CLIENT_ID"];
const clientSecret = env["CLIENT_SECRET"];
const redirectUri = env["REDIRECT_URI"];

const scope = 'channel:read:subscriptions';

// Générer l'URL d'autorisation
const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

// Rediriger l'utilisateur vers cette URL pour obtenir le code d'autorisation
console.log(`Visite cette URL pour autoriser l'application: ${authUrl}`);
async function getUserOAuthToken(code: string) {
  const response = await fetch(`https://id.twitch.tv/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erreur lors de l\'obtention du token:', error);
    return null;
  }

  const data = await response.json();
  return data.access_token;
}

// Remplace 'AUTH_CODE' par le code d'autorisation que tu as obtenu
const authCode = 'AUTH_CODE';
const token = await getUserOAuthToken(authCode);
console.log('User Access Token:', token);