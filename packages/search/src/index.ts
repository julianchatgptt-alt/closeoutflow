export type SearchScope = {
  organizationId: string;
  actorId: string;
};

export type SearchQuery = {
  text: string;
  scope: SearchScope;
  limit: number;
};

export type SearchResult = {
  id: string;
  type: string;
  title: string;
  score: number;
};

export interface SearchAdapter {
  search(query: SearchQuery): Promise<readonly SearchResult[]>;
}

export const noopSearchAdapter: SearchAdapter = {
  async search() {
    return [];
  }
};
