import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "../../api/auth/[...nextauth]";
import ChatPage from "../../components/chatPage";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/api/auth/signin');
        return null;
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        redirect('/api/auth/signin');
        return;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-blue-600 text-white p-4 shadow-md">
                <h1 className="text-2xl font-semibold">Chat Application</h1>
            </header>
            <main className="flex-1 flex">
                <ChatPage userId={userId} />
            </main>
        </div>
    );
}
