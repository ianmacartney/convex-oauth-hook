import { Button } from "@/components/ui/button";
import { useConvex, useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useOAuthData } from "./hooks/useOAuth";

function App() {
  const numbers = useQuery(api.myFunctions.listNumbers, { count: 10 });
  const addNumber = useMutation(api.myFunctions.addNumber);
  const auth = useConvexAuth();
  const data = useOAuthData();
  const convex = useConvex();

  return (
    <main className="container max-w-2xl flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold my-8 text-center">
        Convex + React (Vite)
      </h1>
      <div>{JSON.stringify(auth)}</div>
      <div>{JSON.stringify(data)}</div>
      <Button
        onClick={() => {
          window.location.href = `https://github.com/login/oauth/authorize?client_id=${
            import.meta.env.VITE_CLIENT_ID
          }&state=testing&scope=user:email%20read:user`;
        }}
      >
        Log In
      </Button>
      <Button
        onClick={() => {
          convex.setAuth(async () => "my-manual-token");
        }}
      >
        Set Token
      </Button>

      <p>
        Click the button and open this page in another window - this data is
        persisted in the Convex cloud database!
      </p>
      <p>
        <Button
          onClick={() => {
            void addNumber({ value: Math.floor(Math.random() * 10) });
          }}
        >
          Add a random number
        </Button>
      </p>
      <p>
        Numbers:{" "}
        {numbers?.length === 0
          ? "Click the button!"
          : numbers?.join(", ") ?? "..."}
      </p>
      <p>
        Edit{" "}
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
          convex/myFunctions.ts
        </code>{" "}
        to change your backend
      </p>
      <p>
        Edit{" "}
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
          src/App.tsx
        </code>{" "}
        to change your frontend
      </p>
      <p>
        Check out{" "}
        <a
          className="font-medium text-primary underline underline-offset-4"
          target="_blank"
          href="https://docs.convex.dev/home"
        >
          Convex docs
        </a>
      </p>
    </main>
  );
}

export default App;
