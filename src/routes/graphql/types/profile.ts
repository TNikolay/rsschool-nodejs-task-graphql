import { GraphQLBoolean, GraphQLInt, GraphQLObjectType } from 'graphql';
import { MemberTypeId, memberType } from './member.js';
import { UUIDType } from './uuid.js';

export const profileType = new GraphQLObjectType({
  name: 'profile',
  fields: {
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    userId: { type: UUIDType },
    memberTypeId: { type: MemberTypeId },
    memberType: {
      type: memberType,
      resolve: async ({ memberTypeId }, _, { prisma }) =>
        prisma.memberType.findUnique({ where: { id: memberTypeId } }),
    },
  },
});
