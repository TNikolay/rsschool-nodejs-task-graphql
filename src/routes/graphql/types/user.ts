import { GraphQLFloat, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { postType } from './post.js';
import { profileType } from './profile.js';
import { UUIDType } from './uuid.js';

export const userType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    posts: {
      type: new GraphQLList(postType),
      resolve: async ({ id }, _, { prisma }) =>
        await prisma.post.findMany({ where: { authorId: id } }),
    },
    profile: {
      type: profileType,
      resolve: async ({ id }, _, { prisma }) =>
        await prisma.profile.findUnique({ where: { userId: id } }),
    },
    userSubscribedTo: {
      type: new GraphQLList(userType),
      resolve: async ({ id }, _, { prisma }) =>
        prisma.user.findMany({
          where: { subscribedToUser: { some: { subscriberId: id } } },
        }),
    },
    subscribedToUser: {
      type: new GraphQLList(userType),
      resolve: async ({ id }, _, { prisma }) =>
        prisma.user.findMany({ where: { userSubscribedTo: { some: { authorId: id } } } }),
    },
  }),
});
