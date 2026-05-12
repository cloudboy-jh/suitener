export const version = "0.1.0";

export function printVersion(json: boolean): number {
  console.log(json ? JSON.stringify({ version }) : version);
  return 0;
}
