import { v } from "convex/values";
import { action } from "./_generated/server";

export type OAuthAccessTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

const AccessTokenUrl = process.env.OAUTH_ACCESS_TOKEN_URL;
const TokenRefreshUrl = process.env.OAUTH_TOKEN_REFRESH_URL;

const exampleAccessTokenUrl =
  "https://github.com/login/oauth/access_token?client_id=<YOUR CLIENT ID>&client_secret=<YOUR CLIENT SECRET>";
const exampleTokenRefreshUrl =
  "https://github.com/login/oauth/access_token?client_id=<YOUR CLIENT ID>&client_secret=<YOUR CLIENT SECRET>&grant_type=refresh_token";
if (!AccessTokenUrl || !TokenRefreshUrl) {
  const deploymentName = process.env.CONVEX_CLOUD_URL?.slice(8).replace(
    ".convex.cloud",
    ""
  );
  throw new Error(
    "\n  Missing OAuth environment variable(s).\n\n" +
      "  Examples for GitHub (fill in your info):\n" +
      `  OAUTH_ACCESS_TOKEN_URL= ${exampleAccessTokenUrl}\n` +
      `  OAUTH_TOKEN_REFRESH_URL= ${exampleTokenRefreshUrl}\n` +
      "  Add them here:\n" +
      "  https://dashboard.convex.dev/d/" +
      deploymentName +
      "/settings?var=OAUTH_ACCESS_TOKEN_URL&var=OAUTH_TOKEN_REFRESH_URL"
  );
}

if (AccessTokenUrl && !AccessTokenUrl.includes("client_id")) {
  throw new Error(
    "OAUTH_ACCESS_TOKEN_URL is missing client_id\n\n" +
      `  e.g. OAUTH_ACCESS_TOKEN_URL= ${exampleAccessTokenUrl}\n`
  );
}

if (TokenRefreshUrl && !TokenRefreshUrl.includes("client_id")) {
  throw new Error(
    "OAUTH_TOKEN_REFRESH_URL is missing client_id\n\n" +
      `  e.g. OAUTH_TOKEN_REFRESH_URL= ${exampleTokenRefreshUrl}\n`
  );
}

export const exchangeCode = action({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const url = new URL(AccessTokenUrl);
    url.searchParams.set("code", args.code);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });
    if (resp.status !== 200) {
      throw new Error(
        "Failed to exchange OAuth code for access token: " + resp.statusText
      );
    }
    const data = await resp.json();
    if (data.error) {
      throw new Error(
        "Failed to exchange OAuth code for access token: " +
          JSON.stringify(data)
      );
    }
    return data as OAuthAccessTokenResponse;
  },
});

export type OAuthRefreshResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

export const refreshAccessToken = action({
  args: { refreshToken: v.string() },
  handler: async (ctx, args) => {
    const url = new URL(TokenRefreshUrl);
    url.searchParams.set("refresh_token", args.refreshToken);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });
    const data: OAuthRefreshResponse = await resp.json();
    return data;
  },
});
