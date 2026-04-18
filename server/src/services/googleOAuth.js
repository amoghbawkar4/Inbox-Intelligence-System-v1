import { google } from "googleapis";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile"
];

export function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth environment variables are required");
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl() {
  const oauth2Client = getOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    include_granted_scopes: true
  });
}

export async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: profile } = await oauth2.userinfo.get();

  return { tokens, profile };
}

export async function refreshUserAccessToken(user) {
  if (!user.refreshToken) {
    throw new Error("User is missing a refresh token");
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: user.refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  user.accessToken = credentials.access_token;
  user.tokenExpiry = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 55 * 60 * 1000);

  await user.save();
  return user.accessToken;
}

export async function getValidAccessToken(user) {
  const expiresSoon = !user.tokenExpiry || user.tokenExpiry.getTime() < Date.now() + 60000;
  if (!expiresSoon && user.accessToken) {
    return user.accessToken;
  }

  return refreshUserAccessToken(user);
}
