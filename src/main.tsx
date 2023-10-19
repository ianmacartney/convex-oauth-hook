import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { makeUseOAuth } from "./hooks/useOAuth";
import { api } from "../convex/_generated/api";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const useOAuth = makeUseOAuth(api.oauth, convex);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProviderWithAuth client={convex} useAuth={useOAuth}>
      <App />
    </ConvexProviderWithAuth>
  </React.StrictMode>
);
