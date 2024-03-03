import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  graphql,
} from 'graphql';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { MemberTypeId, memberType } from './types/member.js';
import { postType } from './types/post.js';
import { profileType } from './types/profile.js';
import { userType } from './types/user.js';
import { UUIDType } from './types/uuid.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },

    async handler(req) {
      const query = new GraphQLObjectType({
        name: 'query',
        fields: {
          posts: {
            type: new GraphQLList(postType),
            resolve: async () => await prisma.post.findMany(),
          },

          post: {
            type: postType,
            args: { id: { type: new GraphQLNonNull(UUIDType) } },
            resolve: async (_, { id }) => await prisma.post.findUnique({ where: { id } }),
          },

          users: {
            type: new GraphQLList(userType),
            resolve: async () => await prisma.user.findMany(),
          },

          user: {
            type: userType,
            args: { id: { type: new GraphQLNonNull(UUIDType) } },
            resolve: async (_, { id }) => await prisma.user.findUnique({ where: { id } }),
          },

          profiles: {
            type: new GraphQLList(profileType),
            resolve: async () => await prisma.profile.findMany(),
          },

          profile: {
            type: profileType,
            args: { id: { type: new GraphQLNonNull(UUIDType) } },
            resolve: async (_, { id }) =>
              await prisma.profile.findUnique({ where: { id } }),
          },

          memberTypes: {
            type: new GraphQLList(memberType),
            resolve: async () => await prisma.memberType.findMany(),
          },

          memberType: {
            type: memberType,
            args: { id: { type: new GraphQLNonNull(MemberTypeId) } },
            resolve: async (_, { id }) =>
              await prisma.memberType.findUnique({ where: { id } }),
          },
        },
      });

      const schema = new GraphQLSchema({ query });

      const res = await graphql({
        schema,
        source: req.body.query,
        variableValues: req.body.variables,
        contextValue: { prisma },
      });

      return { data: res.data, errors: res.errors };
    },
  });
};

export default plugin;
