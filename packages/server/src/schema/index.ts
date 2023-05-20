const typeDefs = `#graphql
    type User {
        name: String
        age: Int
        dob: String
    }

    type Query {
        users: [User]
    }
`;

export { typeDefs };
