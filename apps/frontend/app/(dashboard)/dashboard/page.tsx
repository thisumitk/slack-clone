import  {getServerSession} from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "../../api/auth/[...nextauth]";
import ChatPage from "../../components/chatPage";


export default async function Dashboard () {
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/api/auth/signin')
        return null;

    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        redirect('/api/auth/signin');
        return;
    }
        return ( <div>
        <h1>Chat Application </h1>
        <ChatPage userId={userId} />
    </div>
        );
    
}