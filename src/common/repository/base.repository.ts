import { Model, Document } from "mongoose";
import { decodeCursor, encodeCursor } from "../../utils/cursor";

export interface PaginateResult<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  async paginate(
    filter: any,
    limit: number,
    cursor?: string,
    sortField: keyof T = "_id",
    sortOrder: 1 | -1 = 1,
    select?: string,
  ) {
    const MAX_LIMIT = 50;
    const safeLimit = Math.min(limit, MAX_LIMIT);

    const query: any = { ...filter };

    if (cursor) {
      const decoded = decodeCursor(cursor); // ✅ decode here
      query[sortField as string] = { $gt: decoded };
    }

    const docs = await this.model
      .find(query)
      .select(select || "")
      .sort({ [sortField as string]: sortOrder })
      .limit(safeLimit + 1)
      .lean();

    const hasNextPage = docs.length > safeLimit;
    if (hasNextPage) docs.pop();

    const lastDoc = docs[docs.length - 1];

    return {
      data: docs,
      pageInfo: {
        hasNextPage,
        endCursor: lastDoc
          ? encodeCursor(String((lastDoc as any)[sortField]))
          : null,
      },
    };
  }
}
