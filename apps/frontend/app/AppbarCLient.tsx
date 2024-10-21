"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Appbar } from "../../../packages/ui/src/Appbar";

export const AppbarClient = () => {
    const { data: session, status } = useSession();

    if (status === "loading") return <div className="p-4 text-center">Loading...</div>;

    return (
        <Appbar
            onSignin={() => signIn("credentials")}
            onSignout={signOut}
            user={session?.user}
            className="bg-blue-600 text-white shadow-md"
            logo={<img src="/logo.png" alt="App Logo" className="h-8" />}
            userNameDisplay={
                session?.user ? `${session.user.name} (${session.user.email})` : ""
            }
        />
    );
};
