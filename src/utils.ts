export function isValidFolderName(name: string): boolean {
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  ];

  if (invalidChars.test(name)) return false;
  if (reservedNames.includes(name.toUpperCase())) return false;
  return true;
}

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
