export const colors = {
  pink: "\x1b[95m",
  blue: "\x1b[94m",
  green: "\x1b[92m",
  reset: "\x1b[0m"
};

export function color(enabled: boolean, value: string, name: keyof Omit<typeof colors, "reset">): string {
  if (!enabled) return value;
  return `${colors[name]}${value}${colors.reset}`;
}
