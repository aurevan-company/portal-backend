// pg returns BIGINT and DECIMAL as strings; expose them as numbers in JSON.
export const toNumber = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
