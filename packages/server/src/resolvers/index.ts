const users = [
  {
    name: "Shihab",
    age: 22,
    dob: "29.11.1998",
  },
];

const resolvers = {
  Query: {
    users: () => users,
  },
};

export { resolvers };
