export const getEnvOrThrow = (variable: string) => {
  const result = process.env[variable];
  if (!result) throw new Error(`"${variable}" env var is required!`);
  return result;
};
