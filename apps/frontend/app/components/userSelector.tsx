import React, { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';

interface User {
  id: number;
  name: string;
}

interface UserSelectorProps {
  onUserSelect: (userId: number) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {

      const session = await getSession();
      const accessToken = session?.accessToken;

      try {
        const response = await fetch('https://backend-empty-dawn-4144.fly.dev/api/users', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
        );
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Direct Messages</h3>
      <ul className="overflow-y-auto max-h-80">
        {users.map((user) => (
          <li
            key={user.id}
            onClick={() => onUserSelect(user.id)}
            className="cursor-pointer px-3 py-2 hover:bg-blue-100 rounded-md flex items-center"
          >
            <span className="mr-2 text-gray-600">•</span>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSelector;
