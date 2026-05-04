import { parseAsArrayOf, parseAsFloat, parseAsString, useQueryStates } from "nuqs";

export const useTransactionFilters = () => {
  return useQueryStates(
    {
      search: parseAsString.withDefault(""),
      categories: parseAsArrayOf(parseAsString).withDefault([]),
      minAmount: parseAsFloat,
      maxAmount: parseAsFloat,
      from: parseAsString,
      to: parseAsString,
    },
    {
      shallow: false,
    },
  );
};
