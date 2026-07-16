export type AiSuggestion = {
  suggestion: string;
  confidence: number;
  rationale: string;
  authoritative: false;
};

export interface AiAdapter {
  suggest(input: Readonly<Record<string, unknown>>): Promise<readonly AiSuggestion[]>;
}

export const noopAiAdapter: AiAdapter = {
  async suggest() {
    return [];
  }
};
