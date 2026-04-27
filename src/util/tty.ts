export function isInteractive(): boolean {
  if (process.env.CI === 'true' || process.env.CI === '1') {
    return false;
  }
  if (
    process.env.LIMITLESS_NONINTERACTIVE === '1' ||
    process.env.LIMITLESS_NONINTERACTIVE === 'true'
  ) {
    return false;
  }
  return Boolean(process.stdout.isTTY);
}

export function useColorEnabled(noColor: boolean | undefined, forceColor?: string): boolean {
  if (noColor) {
    return false;
  }
  if (forceColor === '0' || forceColor === 'false') {
    return false;
  }
  if (forceColor === '1' || forceColor === 'true') {
    return true;
  }
  return Boolean(process.stdout.isTTY) && !noColor;
}
