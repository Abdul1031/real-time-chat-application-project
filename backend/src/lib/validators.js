const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_DATA_URI_RE = /^data:image\/(png|jpe?g|gif|webp);base64,/;

export const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_RE.test(email.trim());

export const isValidImageDataUri = (value) =>
  typeof value === "string" && IMAGE_DATA_URI_RE.test(value);

export const MAX_MESSAGE_TEXT_LENGTH = 5000;
