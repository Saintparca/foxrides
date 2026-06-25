// Owner WhatsApp + Orange Money number (Botswana)
export const OWNER_WHATSAPP_LOCAL = "75 389 897";
// International format for wa.me (Botswana country code +267)
export const OWNER_WHATSAPP_INTL = "26775389897";
export const OWNER_ORANGE_MONEY = "75 389 897";

export function waLink(message: string) {
  return `https://wa.me/${OWNER_WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
}
