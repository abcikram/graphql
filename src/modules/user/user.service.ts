import { IUserRepository } from "./user.repository";

export class UserService {
    constructor(private userRepo: IUserRepository) { }

    async getUsers(limit: number, cursor?: string) {
        const users = await this.userRepo.findAllPaginated(limit, cursor);

        const hasNextPage = users.length > limit;

        const edges = users.slice(0, limit).map((user) => ({
            cursor: user._id.toString(),
            node: user,
        }));

        return {
            edges,
            pageInfo: {
                hasNextPage,
                endCursor: edges.length ? edges[edges.length - 1].cursor : null,
            },
        };
    }

}