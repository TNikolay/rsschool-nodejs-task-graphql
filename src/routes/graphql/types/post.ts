import { GraphQLObjectType, GraphQLString } from 'graphql';
import { UUIDType } from './uuid.js';

export const postType = new GraphQLObjectType({
  name: 'post',
  fields: {
    id: { type: UUIDType },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    authorId: { type: UUIDType },
  },
});
