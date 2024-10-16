import { Button } from "./button";

interface AppbarProps {
    user?: {
        name?: string | null;
    };
    onSignin: () => void; 
    onSignout: () => void;
}

export const Appbar = ({
    user,
    onSignin,
    onSignout
}: AppbarProps) => {
    return (
        <div className="flex justify-between items-center border-b px-4 py-2 bg-gray-100 shadow-md">
            <div className="text-lg font-bold text-gray-800">
                Slack-O
            </div>
            <div className="flex items-center">
                {user ? (
                    <span className="text-gray-700 mr-4">{user.name}</span>
                ) : null}
                <Button onClick={user ? onSignout : onSignin}>
                    {user ? "Logout" : "Login"}
                </Button>
            </div>
        </div>
    );
};
