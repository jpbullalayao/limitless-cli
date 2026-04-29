export function isInteractive(): boolean {
  return Boolean(process.stdout.isTTY);
}

export function useColorEnabled(noColor: boolean | undefined): boolean {
  return !noColor && Boolean(process.stdout.isTTY);
}
