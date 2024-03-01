import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
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
      const source = req.body.query;
      console.log({ source });

      const query = new GraphQLObjectType({
        name: 'query',
        fields: {
          posts: {
            type: new GraphQLList(GraphQLString),
            resolve: async () => {
              return (await prisma.post.findMany()).map((post) => post.title);
            },
          },
        },
      });

      const schema = new GraphQLSchema({ query });

      const res = await graphql({
        schema,
        source,
        contextValue: {
          prisma,
        },
      });

      return { data: res.data, errors: res.errors };
    },
  });
};

export default plugin;
