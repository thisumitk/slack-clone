import  {getServerSession} from "next-auth/next";
import { redirect } from 'next/navigation'
import { authOptions } from "../../api/auth/[...nextauth]";


export default async function Dashboard () {
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/api/auth/signin')
        return null;

    }

        return ( <div>
        Dashboard
    </div>
        );
    
}