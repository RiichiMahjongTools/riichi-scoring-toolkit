export const TERMINAL_INDICES = new Set([0, 8, 9, 17, 18, 26]);
export const EAST = 27;
export const SOUTH = 28;
export const WEST = 29;
export const NORTH = 30;
export const HAKU = 31;
export const HATSU = 32;
export const CHUN = 33;

export const WINDS = new Set([EAST, SOUTH, WEST, NORTH]);
export const DRAGONS = new Set([HAKU, HATSU, CHUN]);
export const HONOR_INDICES = new Set([...WINDS, ...DRAGONS]);
export const TERMINAL_AND_HONOR_INDICES = new Set([...TERMINAL_INDICES, ...HONOR_INDICES]);

export const FIVE_RED_MAN = 16;
export const FIVE_RED_PIN = 52;
export const FIVE_RED_SOU = 88;
export const AKA_DORAS = new Set([FIVE_RED_MAN, FIVE_RED_PIN, FIVE_RED_SOU]);

export const DISPLAY_WINDS: Record<number, string> = {
  [EAST]: "East",
  [SOUTH]: "South",
  [WEST]: "West",
  [NORTH]: "North"
};
