// UserSelector.tsx
import React, { useEffect, useState } from 'react';

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
    // Fetch users from your backend
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users'); // Adjust the endpoint accordingly
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h3>Select a user for direct messaging:</h3>
      {users.map((user) => (
        <div key={user.id} onClick={() => onUserSelect(user.id)} style={{ cursor: 'pointer' }}>
          {user.name}
        </div>
      ))}
    </div>
  );
};

export default UserSelector;
