import { ConvexReactClient } from "convex/react";
import { FunctionReference } from "convex/server";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";

const LOCALSTORAGE_KEY = "_convex_oauth";
const REFRESH_TIME_BUFFER = 1000 * 30;

export type OAuthResponseData = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

export type OAuthStoredData = {
  access_token: string;
  expires_at?: number;
  refresh_token?: string;
  refresh_token_expires_at?: number;
};

type OAuthAPI = {
  exchangeCode: FunctionReference<
    "action",
    "public",
    {
      code: string;
    },
    OAuthResponseData
  >;
  refreshAccessToken: FunctionReference<
    "action",
    "public",
    {
      refreshToken: string;
    },
    OAuthResponseData
  >;
};

export function useOAuthData() {
  const [storedData] = useLocalStorage<OAuthStoredData | undefined>(
    LOCALSTORAGE_KEY,
    undefined
  );
  return storedData;
}

export function makeUseOAuth(
  api: OAuthAPI,
  convex: ConvexReactClient,
  redirectUri?: string
) {
  return function useOAuth(): {
    isLoading: boolean;
    isAuthenticated: boolean;
    fetchAccessToken: (args: {
      forceRefreshToken: boolean;
    }) => Promise<string | null>;
  } {
    const [storedData, setStoredData] = useLocalStorage<
      OAuthStoredData | undefined
    >(LOCALSTORAGE_KEY, undefined);
    const url =
      typeof window !== "undefined" ? new URL(window.location.href) : undefined;
    const code = url?.searchParams.get("code");
    url?.searchParams.delete("code");
    const urlWithoutCode = url?.toString();
    const isLoginPage = !redirectUri || url?.toString() === redirectUri;
    const isLoading = !!code && isLoginPage;
    console.log(
      "useOAuth",
      code,
      isLoginPage,
      isLoading,
      storedData,
      urlWithoutCode
    );
    const isAuthenticated =
      !!code ||
      (!!storedData &&
        !!storedData.access_token &&
        (!storedData.expires_at || storedData.expires_at < Date.now()));

    const fetchAccessToken = useCallback(
      async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        function storeData(data: OAuthResponseData) {
          const { expires_in, refresh_token_expires_in, ...rest } = data;
          setStoredData({
            ...rest,
            expires_at: expires_in ? Date.now() + expires_in * 1000 : undefined,
            refresh_token_expires_at: refresh_token_expires_in
              ? Date.now() + refresh_token_expires_in * 1000
              : undefined,
          });
        }
        if (
          forceRefreshToken ||
          code ||
          !isAuthenticated ||
          (storedData &&
            storedData.expires_at &&
            storedData.expires_at < Date.now() + REFRESH_TIME_BUFFER)
        ) {
          if (code && isLoginPage) {
            try {
              const data = await convex.action(api.exchangeCode, { code });
              storeData(data);
              window.location.href = urlWithoutCode!;
              return data.access_token;
            } catch (e) {
              console.error("Failed to exchange OAuth code", e);
            }
          }
          if (
            storedData?.refresh_token &&
            storedData?.refresh_token_expires_at &&
            storedData?.refresh_token_expires_at > Date.now()
          ) {
            const data = await convex.action(api.refreshAccessToken, {
              refreshToken: storedData.refresh_token,
            });
            storeData(data);

            return data.access_token;
          }
        }
        return storedData?.access_token ?? null;
      },
      [
        code,
        isAuthenticated,
        storedData,
        setStoredData,
        isLoginPage,
        urlWithoutCode,
      ]
    );
    console.log({ isLoading, isAuthenticated });
    return useMemo(
      () => ({
        isLoading,
        isAuthenticated,
        fetchAccessToken,
      }),
      [isLoading, isAuthenticated, fetchAccessToken]
    );
  };
}
