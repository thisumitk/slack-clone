"use client";
  import { signIn, signOut, useSession } from "next-auth/react";
  import { Appbar } from "../../../packages/ui/src/Appbar";
  
  export const AppbarClient = () => {
      const { data: session, status } = useSession();
  
      if (status === "loading") return <div>Loading...</div>;
  
      return (
          <Appbar
              onSignin={() => signIn("credentials")}
              onSignout={signOut}
              user={session?.user}
          />
      );
  };
  