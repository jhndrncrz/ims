const NON_WORD = /[^a-z0-9]+/gi;

export const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(NON_WORD)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
