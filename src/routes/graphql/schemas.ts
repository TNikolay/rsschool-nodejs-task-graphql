import { Type } from '@fastify/type-provider-typebox';

export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  }),
);

export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    },
  ),
};

// const rootQuery = new GraphQLObjectType({
//   name: 'Query',
//   fields: {
//     memberTypes: {
//       type: GraphQLInt,
//       resolve: async () => {
//         try {
//           return 42;
//         } catch (err) {
//           //return new Error(err.message);
//           return new Error('EEEEEEEE');
//         }
//       },
//     },
//     // artist: {
//     //   type: artistType,
//     //   args: {
//     //     id: {
//     //       type: new GraphQLNonNull(GraphQLID),
//     //     },
//     //   },
//     //   resolve: async (_, args) => {
//     //     try {
//     //       return await Artists.findById(args.id);
//     //     } catch (err) {
//     //       return new Error(err.message);
//     //     }
//     //   },
//     // },
//   },
// });

// export const gqlSchema = new GraphQLSchema({
//   query: rootQuery,
//   //  mutation: rootMutation,
// });
