import { Button } from "./button";

interface AppbarProps {
    user?: {
        name?: string | null;
    };
    onSignin: () => void; 
    onSignout: () => void;
    className?: string;
    logo?: React.ReactNode;
    userNameDisplay?: string;
}

export const Appbar = ({
    user,
    onSignin,
    onSignout,
    className,
    userNameDisplay
}: AppbarProps) => {
    return (
        <div className={`flex justify-between items-center border-b px-4 py-2 bg-gray-100 shadow-md ${className || ''}`}>
            <div className="flex items-center">
                <div className="text-lg font-bold text-gray-800">
                    Slack-O
                </div>
            </div>
            <div className="flex items-center">
                {userNameDisplay ? ( // Render userNameDisplay if provided
                    <span className="text-gray-700 mr-4">{userNameDisplay}</span>
                ) : user ? (
                    <span className="text-gray-700 mr-4">{user.name}</span>
                ) : null}
                <Button onClick={user ? onSignout : onSignin}>
                    {user ? "Logout" : "Login"}
                </Button>
            </div>
        </div>
    );
};