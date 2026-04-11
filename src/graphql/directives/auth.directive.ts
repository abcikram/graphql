import {
  defaultFieldResolver,
  GraphQLFieldConfig,
  GraphQLError,
  GraphQLSchema,
} from "graphql";
import { getDirective, mapSchema, MapperKind } from "@graphql-tools/utils";
import { GraphQLContext } from "../../common/types/graphql.context";
import { UserRepository } from "../../modules/user/user.repository";
import { rbacService } from "../../modules/rbac/rbac.service";

const userRepository = new UserRepository();

type AuthDirectiveArgs = {
  action: string;
  resource: string;
};

export const authDirectiveTypeDefs = `
  directive @auth(action: PermissionAction!, resource: PermissionResource!) on FIELD_DEFINITION
`;

export const authDirectiveTransformer = (schema: GraphQLSchema) =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (
      fieldConfig: GraphQLFieldConfig<unknown, GraphQLContext>,
    ) => {
      const authDirective = getDirective(
        schema,
        fieldConfig,
        "auth",
      )?.[0] as AuthDirectiveArgs | undefined;

      if (!authDirective) {
        return fieldConfig;
      }

      const { resolve = defaultFieldResolver } = fieldConfig;

      fieldConfig.resolve = async (source, args, context, info) => {
        if (!context.user?.id) {
          throw new GraphQLError("Unauthorized", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        const user = await userRepository.findById(context.user.id);

        const hasPermission = user
          ? await rbacService.hasPermission(
              { _id: user._id, roleIds: user.roleIds },
              authDirective.action.toLowerCase(),
              authDirective.resource.toLowerCase(),
            )
          : false;

        if (!hasPermission) {
          throw new GraphQLError("Forbidden", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        return resolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
