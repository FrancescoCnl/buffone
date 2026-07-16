import cardFront from "./card/fronte_della_card.png";
import cardBack from "./card/RETRO_DELLA_CARD.png";
import jesterIllustration from "./giullare/Gemini_Generated_Image_d65bf2d65bf2d65b.png";

const illustrationModules = import.meta.glob<{ default: string }>(
  "./illustrations/*.png",
  { eager: true }
);

export const illustrations = Object.values(illustrationModules).map(
  (m) => m.default
);

export { cardFront, cardBack, jesterIllustration };
