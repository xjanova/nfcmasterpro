/**
 * Business Card Service — Generates digital business cards with QR codes
 * Creates vCard format and generates QR code data
 */
import { Member, BusinessCardData } from '../types';

// ============================================================
//  Business Card Generation
// ============================================================

/**
 * Generate business card data with QR code
 */
export const generateBusinessCard = (member: Member): BusinessCardData => {
  const vcard = generateVCard(member);

  return {
    memberId: member.id,
    name: member.name,
    position: member.position,
    company: member.company,
    phone: member.phone,
    email: member.email,
    photo: member.photo,
    qrData: encodeURIComponent(vcard),
    style: 'light',
  };
};

// ============================================================
//  vCard Generation
// ============================================================

/**
 * Generate standard vCard 3.0 string
 * Based on RFC 2426
 */
export const generateVCard = (member: Member): string => {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  // Full Name (required)
  lines.push(`FN:${escapVCardField(member.name)}`);

  // Structured Name
  const nameParts = member.name.split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ');
  lines.push(`N:${escapVCardField(lastName)};${escapVCardField(firstName)};;;`);

  // Phone
  if (member.phone) {
    lines.push(`TEL;TYPE=CELL:${escapVCardField(member.phone)}`);
  }

  // Email
  if (member.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapVCardField(member.email)}`);
  }

  // Organization
  if (member.company) {
    lines.push(`ORG:${escapVCardField(member.company)}`);
  }

  // Title / Position
  if (member.position) {
    lines.push(`TITLE:${escapVCardField(member.position)}`);
  }

  // Member ID as custom field (for Thaiprompt)
  lines.push(`NOTE:Thaiprompt Affiliate | Rank: ${member.rank || 'N/A'} | ID: ${member.id}`);

  // Affiliate URL
  if (member.affiliateUrl) {
    lines.push(`URL:${escapVCardField(member.affiliateUrl)}`);
  }

  // Photo (base64 if available)
  if (member.photo) {
    // photo is already base64 encoded
    const base64Data = member.photo.split(',')[1] || member.photo;
    lines.push(`PHOTO;ENCODING=BASE64;TYPE=JPEG:${base64Data}`);
  }

  // Revision timestamp
  lines.push(`REV:${new Date().toISOString()}`);

  lines.push('END:VCARD');

  return lines.join('\r\n');
};

// ============================================================
//  Style Management
// ============================================================

/**
 * Get available business card styles
 */
export const getBusinessCardStyles = (): string[] => {
  return ['dark', 'light', 'gradient'];
};

// ============================================================
//  Helpers
// ============================================================

/**
 * Escape special characters in vCard fields
 */
function escapVCardField(value: string): string {
  if (!value) return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
