export function parseScanResult(text, formatName = '') {
  if (!text || typeof text !== 'string') {
    return { type: 'text', text: '' };
  }

  const trimmed = text.trim();

  // 1. WiFi QR Code: WIFI:S:MySSID;T:WPA;P:MyPassword;;
  if (trimmed.startsWith('WIFI:') || trimmed.startsWith('wifi:')) {
    const ssidMatch = trimmed.match(/S:([^;]+)/i);
    const passMatch = trimmed.match(/P:([^;]+)/i);
    const typeMatch = trimmed.match(/T:([^;]+)/i);
    const hiddenMatch = trimmed.match(/H:([^;]+)/i);

    return {
      type: 'wifi',
      title: 'WiFi Network',
      ssid: ssidMatch ? ssidMatch[1] : 'Unknown SSID',
      password: passMatch ? passMatch[1] : '',
      security: typeMatch ? typeMatch[1] : 'WPA',
      hidden: hiddenMatch ? hiddenMatch[1] === 'true' : false,
      raw: trimmed
    };
  }

  // 2. vCard / MeCard: Contact Information
  if (trimmed.startsWith('BEGIN:VCARD') || trimmed.startsWith('begin:vcard')) {
    const fnMatch = trimmed.match(/\nFN:(.+)/i) || trimmed.match(/FN:(.+)/i);
    const telMatch = trimmed.match(/\nTEL[^:]*:(.+)/i) || trimmed.match(/TEL[^:]*:(.+)/i);
    const emailMatch = trimmed.match(/\nEMAIL[^:]*:(.+)/i) || trimmed.match(/EMAIL[^:]*:(.+)/i);
    const orgMatch = trimmed.match(/\nORG:(.+)/i) || trimmed.match(/ORG:(.+)/i);
    const titleMatch = trimmed.match(/\nTITLE:(.+)/i) || trimmed.match(/TITLE:(.+)/i);

    return {
      type: 'vcard',
      title: 'Contact Card (vCard)',
      name: fnMatch ? fnMatch[1].trim() : 'Contact',
      phone: telMatch ? telMatch[1].trim() : '',
      email: emailMatch ? emailMatch[1].trim() : '',
      org: orgMatch ? orgMatch[1].trim() : '',
      jobTitle: titleMatch ? titleMatch[1].trim() : '',
      raw: trimmed
    };
  }

  // 3. URLs
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return {
        type: 'url',
        title: 'Web Link',
        url: trimmed,
        hostname: url.hostname,
        raw: trimmed
      };
    }
  } catch (_) {}

  // 4. Telephone
  if (trimmed.startsWith('tel:') || trimmed.startsWith('TEL:')) {
    const phone = trimmed.replace(/^tel:/i, '').trim();
    return {
      type: 'tel',
      title: 'Phone Number',
      phone: phone,
      actionUrl: `tel:${phone}`,
      raw: trimmed
    };
  }

  // 5. Email
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('MAILTO:')) {
    const email = trimmed.replace(/^mailto:/i, '').split('?')[0].trim();
    return {
      type: 'email',
      title: 'Email Address',
      email: email,
      actionUrl: trimmed,
      raw: trimmed
    };
  }

  // 6. SMS
  if (trimmed.startsWith('sms:') || trimmed.startsWith('SMS:') || trimmed.startsWith('smsto:')) {
    const parts = trimmed.replace(/^(sms:|smsto:)/i, '').split(':');
    const number = parts[0] ? parts[0].trim() : '';
    const body = parts[1] ? parts[1].trim() : '';
    return {
      type: 'sms',
      title: 'SMS Message',
      number: number,
      body: body,
      actionUrl: `sms:${number}`,
      raw: trimmed
    };
  }

  // 7. Geo Location
  if (trimmed.startsWith('geo:')) {
    const coords = trimmed.replace(/^geo:/i, '').split('?')[0].split(',');
    const lat = coords[0];
    const lng = coords[1];
    return {
      type: 'geo',
      title: 'Geographic Location',
      lat,
      lng,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      raw: trimmed
    };
  }

  // 8. Product Barcodes (EAN-13, EAN-8, UPC-A, UPC-E)
  const isNumericCode = /^\d{8,14}$/.test(trimmed);
  const isProductFormat = /EAN|UPC/i.test(formatName) || (isNumericCode && (trimmed.length === 8 || trimmed.length === 12 || trimmed.length === 13 || trimmed.length === 14));
  if (isProductFormat) {
    return {
      type: 'product',
      title: 'Product Barcode',
      code: trimmed,
      formatName: formatName || 'EAN/UPC',
      searchUrl: `https://www.google.com/search?q=${trimmed}`,
      openFoodFactsUrl: `https://world.openfoodfacts.org/product/${trimmed}`,
      barcodeLookupUrl: `https://www.barcodelookup.com/${trimmed}`,
      raw: trimmed
    };
  }

  // Default: Plain Text
  return {
    type: 'text',
    title: 'Text / Code',
    text: trimmed,
    raw: trimmed
  };
}
