/** @namespace Server */

// Apollo Server imports
import { createApolloServer } from 'meteor/apollo';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

const typeList = [];
const resolverList = [];


if (typeList.length > 0 && resolverList.length > 0) {

    const typeDefs = mergeTypes(typeList);
    const resolvers = mergeResolvers(resolverList);

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });

    createApolloServer({
        schema,
    });
}
