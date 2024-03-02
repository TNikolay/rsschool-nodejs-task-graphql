import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  graphql,
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import { profile } from 'console';

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
      const postType = new GraphQLObjectType({
        name: 'post',
        fields: {
          id: { type: UUIDType },
          title: { type: GraphQLString },
          content: { type: GraphQLString },
          authorId: { type: UUIDType },
        },
      });

      const MemberTypeId = new GraphQLEnumType({
        name: 'MemberTypeId',
        values: {
          basic: { value: 'basic' },
          business: { value: 'business' },
        },
      });

      const memberType = new GraphQLObjectType({
        name: 'memberType',
        fields: {
          id: { type: MemberTypeId },
          discount: { type: GraphQLFloat },
          postsLimitPerMonth: { type: GraphQLInt },
        },
      });

      const profileType = new GraphQLObjectType({
        name: 'profile',
        fields: {
          id: { type: UUIDType },
          isMale: { type: GraphQLBoolean },
          yearOfBirth: { type: GraphQLInt },
          userId: { type: UUIDType },
          memberTypeId: { type: MemberTypeId },
          memberType: {
            type: memberType,
            resolve: async ({ memberTypeId }) =>
              prisma.memberType.findFirst({ where: { id: memberTypeId } }),
          },
        },
      });

      const userType = new GraphQLObjectType({
        name: 'user',
        fields: () => ({
          id: { type: UUIDType },
          name: { type: GraphQLString },
          balance: { type: GraphQLFloat },
          posts: {
            type: new GraphQLList(postType),
            resolve: async ({ id }) =>
              await prisma.post.findMany({ where: { authorId: id } }),
          },
          profile: {
            type: profileType,
            resolve: async ({ id }) =>
              await prisma.profile.findFirst({ where: { userId: id } }),
          },
          userSubscribedTo: {
            type: new GraphQLList(userType),
            resolve: async ({ id }) => {
              return prisma.user.findMany({
                where: { subscribedToUser: { some: { subscriberId: id } } },
              });
            },
          },
          subscribedToUser: {
            type: new GraphQLList(userType),
            resolve: async ({ id }) => {
              return prisma.user.findMany({
                where: { userSubscribedTo: { some: { authorId: id } } },
              });
            },
          },
        }),
      });

      // -----------------------------

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
            resolve: async (_, { id }) => await prisma.post.findFirst({ where: { id } }),
          },

          users: {
            type: new GraphQLList(userType),
            resolve: async () => await prisma.user.findMany(),
          },

          user: {
            type: userType,
            args: { id: { type: new GraphQLNonNull(UUIDType) } },
            resolve: async (_, { id }) => await prisma.user.findFirst({ where: { id } }),
          },

          profiles: {
            type: new GraphQLList(profileType),
            resolve: async () => await prisma.profile.findMany(),
          },

          profile: {
            type: profileType,
            args: { id: { type: new GraphQLNonNull(UUIDType) } },
            resolve: async (_, { id }) =>
              await prisma.profile.findFirst({ where: { id } }),
          },

          memberTypes: {
            type: new GraphQLList(memberType),
            resolve: async () => await prisma.memberType.findMany(),
          },

          memberType: {
            type: memberType,
            args: { id: { type: new GraphQLNonNull(MemberTypeId) } },
            resolve: async (_, { id }) =>
              await prisma.memberType.findFirst({ where: { id } }),
          },
          //--------
        },
      });

      const schema = new GraphQLSchema({ query });

      const res = await graphql({
        schema,
        source: req.body.query,
        variableValues: req.body.variables,
        contextValue: {
          prisma,
        },
      });

      return { data: res.data, errors: res.errors };
    },
  });
};

export default plugin;
