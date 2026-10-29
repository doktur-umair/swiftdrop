import bcrypt from "bcrypt";
// A real cost-12 comparison also runs for unknown/passwordless/inactive accounts.
const dummy = bcrypt.hash("dummy account comparison only", 12);
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export async function checkPassword(
  password: string,
  hash: string | null | undefined,
) {
  const matches = await bcrypt.compare(password, hash ?? (await dummy));
  return Boolean(hash) && matches;
}
