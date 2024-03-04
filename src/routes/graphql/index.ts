import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  graphql,
  parse,
  validate,
} from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { MemberTypeId, memberType } from './types/member.js';
import { ChangePostInput, CreatePostInput, postType } from './types/post.js';
import { ChangeProfileInput, CreateProfileInput, profileType } from './types/profile.js';
import { ChangeUserInput, CreateUserInput, userType } from './types/user.js';
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

      const mutation = new GraphQLObjectType({
        name: 'mutation',
        fields: {
          createPost: {
            type: postType,
            args: { dto: { type: CreatePostInput } },
            resolve: async (_, data) => await prisma.post.create({ data: data.dto }),
          },

          changePost: {
            type: postType,
            args: {
              id: { type: UUIDType },
              dto: { type: ChangePostInput },
            },
            resolve: async (_, { id, dto }) =>
              await prisma.post.update({ where: { id }, data: dto }),
          },

          deletePost: {
            type: GraphQLBoolean,
            args: { id: { type: UUIDType } },
            resolve: async (_, { id }) => {
              await prisma.post.delete({ where: { id } });
              return true;
            },
          },

          createUser: {
            type: userType,
            args: { dto: { type: CreateUserInput } },
            resolve: async (_, data) => await prisma.user.create({ data: data.dto }),
          },

          changeUser: {
            type: userType,
            args: {
              id: { type: UUIDType },
              dto: { type: ChangeUserInput },
            },
            resolve: async (_, { id, dto }) =>
              await prisma.user.update({ where: { id }, data: dto }),
          },

          deleteUser: {
            type: GraphQLBoolean,
            args: { id: { type: UUIDType } },
            resolve: async (_, { id }) => {
              await prisma.user.delete({ where: { id } });
              return true;
            },
          },

          createProfile: {
            type: profileType,
            args: { dto: { type: CreateProfileInput } },
            resolve: async (_, data) => await prisma.profile.create({ data: data.dto }),
          },

          changeProfile: {
            type: profileType,
            args: {
              id: { type: UUIDType },
              dto: { type: ChangeProfileInput },
            },
            resolve: async (_, { id, dto }) =>
              await prisma.profile.update({ where: { id }, data: dto }),
          },

          deleteProfile: {
            type: GraphQLBoolean,
            args: { id: { type: UUIDType } },
            resolve: async (_, { id }) => {
              await prisma.profile.delete({ where: { id } });
              return true;
            },
          },

          subscribeTo: {
            type: userType,
            args: {
              userId: { type: UUIDType },
              authorId: { type: UUIDType },
            },
            resolve: async (_, { userId, authorId }) =>
              prisma.user.update({
                where: { id: userId },
                data: { userSubscribedTo: { create: { authorId } } },
              }),
          },

          unsubscribeFrom: {
            type: GraphQLBoolean,
            args: {
              userId: { type: UUIDType },
              authorId: { type: UUIDType },
            },
            resolve: async (_, { userId, authorId }) => {
              await prisma.subscribersOnAuthors.delete({
                where: { subscriberId_authorId: { subscriberId: userId, authorId } },
              });
              return true;
            },
          },
        },
      });

      const schema = new GraphQLSchema({ query, mutation });

      const validationErrors = validate(schema, parse(req.body.query), [depthLimit(5)]);
      if (validationErrors.length > 0) return { errors: validationErrors };

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
