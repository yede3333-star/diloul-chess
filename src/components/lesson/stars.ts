/** Stars from mistakes (SPEC §6.4): none = 3, one or two = 2, more = 1. A hint counts as a mistake. */
export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
