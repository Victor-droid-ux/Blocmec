import QRCode from "qrcode";

export async function generateQRCodeWithBanner(
  data: string,
  options: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: {
      dark?: string;
      light?: string;
    };
  } = {},
): Promise<string> {
  const width = options.width || 300;
  const margin = options.margin || 1;
  const errorCorrectionLevel = options.errorCorrectionLevel || "H";
  const darkColor = options.color?.dark || "#000000";
  const lightColor = options.color?.light || "#FFFFFF";

  const qrCodeDataUrl = await QRCode.toDataURL(data, {
    errorCorrectionLevel,
    margin,
    width,
    color: { dark: darkColor, light: lightColor },
  });

  const canvas = document.createElement("canvas");
  const bannerHeight = Math.round(width * 0.2);
  const totalHeight = width + bannerHeight;

  canvas.width = width;
  canvas.height = totalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const qrImage = new Image();
  qrImage.src = qrCodeDataUrl;
  await new Promise((resolve) => {
    qrImage.onload = resolve;
  });

  const bannerImage = new Image();
  bannerImage.crossOrigin = "anonymous";
  bannerImage.src = "/images/verification-banner.png";
  await new Promise((resolve) => {
    bannerImage.onload = resolve;
  });

  ctx.drawImage(qrImage, 0, 0, width, width);
  ctx.drawImage(bannerImage, 0, width, width, bannerHeight);

  return canvas.toDataURL("image/png");
}

export async function generateQRCodeDataUrl(
  data: string,
  options: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: {
      dark?: string;
      light?: string;
    };
  } = {},
): Promise<string> {
  const width = options.width || 300;
  const margin = options.margin || 1;
  const errorCorrectionLevel = options.errorCorrectionLevel || "H";
  const darkColor = options.color?.dark || "#000000";
  const lightColor = options.color?.light || "#FFFFFF";

  return await QRCode.toDataURL(data, {
    errorCorrectionLevel,
    margin,
    width,
    color: { dark: darkColor, light: lightColor },
  });
}
