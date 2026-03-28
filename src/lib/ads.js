export const AD_CONFIG = {
  // 1. Your new "Cloaked" base URL
  CLOAKED_DOMAIN: "https://media.yourwebsite.com",
  
  // 2. The specific paths or IDs provided by your network
  DESKTOP_ZONE: "123",
  MOBILE_ZONE: "456",
  
  COOLDOWN: 30 * 60 * 1000 
};

export const getAdLink = () => {
  const isMobile = /iPhone|Android/i.test(navigator.userAgent);
  
  // 3. Construct the link using YOUR domain instead of the AD network's domain
  // This makes the link look like: https://media.yourwebsite.com/ad/123
  const zone = isMobile ? AD_CONFIG.MOBILE_ZONE : AD_CONFIG.DESKTOP_ZONE;
  
  return `${AD_CONFIG.CLOAKED_DOMAIN}/?zoneid=${zone}`;
};
