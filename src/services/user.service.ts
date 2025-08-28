interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [];

export const getAllUsers = async (): Promise<User[]> => {
  return users;
};

export const createUser = async (data: Partial<User>): Promise<User> => {
  const newUser: User = {
    id: users.length + 1,
    name: data.name || "Unnamed",
    email: data.email || "noemail@example.com",
  };
  users.push(newUser);
  return newUser;
};
