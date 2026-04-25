/**
 * Phone number utilities for the Indian market.
 * The backend requires E.164 format: +919876543210
 */

export const PHONE_COUNTRY_CODES = [
  { iso2: 'IN', dialCode: '+91',   label: 'India (+91)' },
  { iso2: 'AF', dialCode: '+93',   label: 'Afghanistan (+93)' },
  { iso2: 'AL', dialCode: '+355',  label: 'Albania (+355)' },
  { iso2: 'DZ', dialCode: '+213',  label: 'Algeria (+213)' },
  { iso2: 'AS', dialCode: '+1684', label: 'American Samoa (+1684)' },
  { iso2: 'AD', dialCode: '+376',  label: 'Andorra (+376)' },
  { iso2: 'AO', dialCode: '+244',  label: 'Angola (+244)' },
  { iso2: 'AI', dialCode: '+1264', label: 'Anguilla (+1264)' },
  { iso2: 'AG', dialCode: '+1268', label: 'Antigua and Barbuda (+1268)' },
  { iso2: 'AR', dialCode: '+54',   label: 'Argentina (+54)' },
  { iso2: 'AM', dialCode: '+374',  label: 'Armenia (+374)' },
  { iso2: 'AW', dialCode: '+297',  label: 'Aruba (+297)' },
  { iso2: 'AU', dialCode: '+61',   label: 'Australia (+61)' },
  { iso2: 'AT', dialCode: '+43',   label: 'Austria (+43)' },
  { iso2: 'AZ', dialCode: '+994',  label: 'Azerbaijan (+994)' },
  { iso2: 'BS', dialCode: '+1242', label: 'Bahamas (+1242)' },
  { iso2: 'BH', dialCode: '+973',  label: 'Bahrain (+973)' },
  { iso2: 'BD', dialCode: '+880',  label: 'Bangladesh (+880)' },
  { iso2: 'BB', dialCode: '+1246', label: 'Barbados (+1246)' },
  { iso2: 'BY', dialCode: '+375',  label: 'Belarus (+375)' },
  { iso2: 'BE', dialCode: '+32',   label: 'Belgium (+32)' },
  { iso2: 'BZ', dialCode: '+501',  label: 'Belize (+501)' },
  { iso2: 'BJ', dialCode: '+229',  label: 'Benin (+229)' },
  { iso2: 'BM', dialCode: '+1441', label: 'Bermuda (+1441)' },
  { iso2: 'BT', dialCode: '+975',  label: 'Bhutan (+975)' },
  { iso2: 'BO', dialCode: '+591',  label: 'Bolivia (+591)' },
  { iso2: 'BA', dialCode: '+387',  label: 'Bosnia and Herzegovina (+387)' },
  { iso2: 'BW', dialCode: '+267',  label: 'Botswana (+267)' },
  { iso2: 'BR', dialCode: '+55',   label: 'Brazil (+55)' },
  { iso2: 'IO', dialCode: '+246',  label: 'British Indian Ocean Territory (+246)' },
  { iso2: 'VG', dialCode: '+1284', label: 'British Virgin Islands (+1284)' },
  { iso2: 'BN', dialCode: '+673',  label: 'Brunei (+673)' },
  { iso2: 'BG', dialCode: '+359',  label: 'Bulgaria (+359)' },
  { iso2: 'BF', dialCode: '+226',  label: 'Burkina Faso (+226)' },
  { iso2: 'BI', dialCode: '+257',  label: 'Burundi (+257)' },
  { iso2: 'KH', dialCode: '+855',  label: 'Cambodia (+855)' },
  { iso2: 'CM', dialCode: '+237',  label: 'Cameroon (+237)' },
  { iso2: 'CA', dialCode: '+1',    label: 'Canada (+1)' },
  { iso2: 'CV', dialCode: '+238',  label: 'Cape Verde (+238)' },
  { iso2: 'KY', dialCode: '+1345', label: 'Cayman Islands (+1345)' },
  { iso2: 'CF', dialCode: '+236',  label: 'Central African Republic (+236)' },
  { iso2: 'TD', dialCode: '+235',  label: 'Chad (+235)' },
  { iso2: 'CL', dialCode: '+56',   label: 'Chile (+56)' },
  { iso2: 'CN', dialCode: '+86',   label: 'China (+86)' },
  { iso2: 'CX', dialCode: '+61',   label: 'Christmas Island (+61)' },
  { iso2: 'CC', dialCode: '+61',   label: 'Cocos Islands (+61)' },
  { iso2: 'CO', dialCode: '+57',   label: 'Colombia (+57)' },
  { iso2: 'KM', dialCode: '+269',  label: 'Comoros (+269)' },
  { iso2: 'CK', dialCode: '+682',  label: 'Cook Islands (+682)' },
  { iso2: 'CR', dialCode: '+506',  label: 'Costa Rica (+506)' },
  { iso2: 'HR', dialCode: '+385',  label: 'Croatia (+385)' },
  { iso2: 'CU', dialCode: '+53',   label: 'Cuba (+53)' },
  { iso2: 'CW', dialCode: '+599',  label: 'Curaçao (+599)' },
  { iso2: 'CY', dialCode: '+357',  label: 'Cyprus (+357)' },
  { iso2: 'CZ', dialCode: '+420',  label: 'Czech Republic (+420)' },
  { iso2: 'CD', dialCode: '+243',  label: 'DR Congo (+243)' },
  { iso2: 'DK', dialCode: '+45',   label: 'Denmark (+45)' },
  { iso2: 'DJ', dialCode: '+253',  label: 'Djibouti (+253)' },
  { iso2: 'DM', dialCode: '+1767', label: 'Dominica (+1767)' },
  { iso2: 'DO', dialCode: '+1809', label: 'Dominican Republic (+1809)' },
  { iso2: 'EC', dialCode: '+593',  label: 'Ecuador (+593)' },
  { iso2: 'EG', dialCode: '+20',   label: 'Egypt (+20)' },
  { iso2: 'SV', dialCode: '+503',  label: 'El Salvador (+503)' },
  { iso2: 'GQ', dialCode: '+240',  label: 'Equatorial Guinea (+240)' },
  { iso2: 'ER', dialCode: '+291',  label: 'Eritrea (+291)' },
  { iso2: 'EE', dialCode: '+372',  label: 'Estonia (+372)' },
  { iso2: 'SZ', dialCode: '+268',  label: 'Eswatini (+268)' },
  { iso2: 'ET', dialCode: '+251',  label: 'Ethiopia (+251)' },
  { iso2: 'FK', dialCode: '+500',  label: 'Falkland Islands (+500)' },
  { iso2: 'FO', dialCode: '+298',  label: 'Faroe Islands (+298)' },
  { iso2: 'FJ', dialCode: '+679',  label: 'Fiji (+679)' },
  { iso2: 'FI', dialCode: '+358',  label: 'Finland (+358)' },
  { iso2: 'FR', dialCode: '+33',   label: 'France (+33)' },
  { iso2: 'GF', dialCode: '+594',  label: 'French Guiana (+594)' },
  { iso2: 'PF', dialCode: '+689',  label: 'French Polynesia (+689)' },
  { iso2: 'GA', dialCode: '+241',  label: 'Gabon (+241)' },
  { iso2: 'GM', dialCode: '+220',  label: 'Gambia (+220)' },
  { iso2: 'GE', dialCode: '+995',  label: 'Georgia (+995)' },
  { iso2: 'DE', dialCode: '+49',   label: 'Germany (+49)' },
  { iso2: 'GH', dialCode: '+233',  label: 'Ghana (+233)' },
  { iso2: 'GI', dialCode: '+350',  label: 'Gibraltar (+350)' },
  { iso2: 'GR', dialCode: '+30',   label: 'Greece (+30)' },
  { iso2: 'GL', dialCode: '+299',  label: 'Greenland (+299)' },
  { iso2: 'GD', dialCode: '+1473', label: 'Grenada (+1473)' },
  { iso2: 'GP', dialCode: '+590',  label: 'Guadeloupe (+590)' },
  { iso2: 'GU', dialCode: '+1671', label: 'Guam (+1671)' },
  { iso2: 'GT', dialCode: '+502',  label: 'Guatemala (+502)' },
  { iso2: 'GG', dialCode: '+44',   label: 'Guernsey (+44)' },
  { iso2: 'GN', dialCode: '+224',  label: 'Guinea (+224)' },
  { iso2: 'GW', dialCode: '+245',  label: 'Guinea-Bissau (+245)' },
  { iso2: 'GY', dialCode: '+592',  label: 'Guyana (+592)' },
  { iso2: 'HT', dialCode: '+509',  label: 'Haiti (+509)' },
  { iso2: 'HN', dialCode: '+504',  label: 'Honduras (+504)' },
  { iso2: 'HK', dialCode: '+852',  label: 'Hong Kong (+852)' },
  { iso2: 'HU', dialCode: '+36',   label: 'Hungary (+36)' },
  { iso2: 'IS', dialCode: '+354',  label: 'Iceland (+354)' },
  { iso2: 'ID', dialCode: '+62',   label: 'Indonesia (+62)' },
  { iso2: 'IR', dialCode: '+98',   label: 'Iran (+98)' },
  { iso2: 'IQ', dialCode: '+964',  label: 'Iraq (+964)' },
  { iso2: 'IE', dialCode: '+353',  label: 'Ireland (+353)' },
  { iso2: 'IM', dialCode: '+44',   label: 'Isle of Man (+44)' },
  { iso2: 'IL', dialCode: '+972',  label: 'Israel (+972)' },
  { iso2: 'IT', dialCode: '+39',   label: 'Italy (+39)' },
  { iso2: 'CI', dialCode: '+225',  label: 'Ivory Coast (+225)' },
  { iso2: 'JM', dialCode: '+1876', label: 'Jamaica (+1876)' },
  { iso2: 'JP', dialCode: '+81',   label: 'Japan (+81)' },
  { iso2: 'JE', dialCode: '+44',   label: 'Jersey (+44)' },
  { iso2: 'JO', dialCode: '+962',  label: 'Jordan (+962)' },
  { iso2: 'KZ', dialCode: '+7',    label: 'Kazakhstan (+7)' },
  { iso2: 'KE', dialCode: '+254',  label: 'Kenya (+254)' },
  { iso2: 'KI', dialCode: '+686',  label: 'Kiribati (+686)' },
  { iso2: 'XK', dialCode: '+383',  label: 'Kosovo (+383)' },
  { iso2: 'KW', dialCode: '+965',  label: 'Kuwait (+965)' },
  { iso2: 'KG', dialCode: '+996',  label: 'Kyrgyzstan (+996)' },
  { iso2: 'LA', dialCode: '+856',  label: 'Laos (+856)' },
  { iso2: 'LV', dialCode: '+371',  label: 'Latvia (+371)' },
  { iso2: 'LB', dialCode: '+961',  label: 'Lebanon (+961)' },
  { iso2: 'LS', dialCode: '+266',  label: 'Lesotho (+266)' },
  { iso2: 'LR', dialCode: '+231',  label: 'Liberia (+231)' },
  { iso2: 'LY', dialCode: '+218',  label: 'Libya (+218)' },
  { iso2: 'LI', dialCode: '+423',  label: 'Liechtenstein (+423)' },
  { iso2: 'LT', dialCode: '+370',  label: 'Lithuania (+370)' },
  { iso2: 'LU', dialCode: '+352',  label: 'Luxembourg (+352)' },
  { iso2: 'MO', dialCode: '+853',  label: 'Macau (+853)' },
  { iso2: 'MK', dialCode: '+389',  label: 'North Macedonia (+389)' },
  { iso2: 'MG', dialCode: '+261',  label: 'Madagascar (+261)' },
  { iso2: 'MW', dialCode: '+265',  label: 'Malawi (+265)' },
  { iso2: 'MY', dialCode: '+60',   label: 'Malaysia (+60)' },
  { iso2: 'MV', dialCode: '+960',  label: 'Maldives (+960)' },
  { iso2: 'ML', dialCode: '+223',  label: 'Mali (+223)' },
  { iso2: 'MT', dialCode: '+356',  label: 'Malta (+356)' },
  { iso2: 'MH', dialCode: '+692',  label: 'Marshall Islands (+692)' },
  { iso2: 'MQ', dialCode: '+596',  label: 'Martinique (+596)' },
  { iso2: 'MR', dialCode: '+222',  label: 'Mauritania (+222)' },
  { iso2: 'MU', dialCode: '+230',  label: 'Mauritius (+230)' },
  { iso2: 'YT', dialCode: '+262',  label: 'Mayotte (+262)' },
  { iso2: 'MX', dialCode: '+52',   label: 'Mexico (+52)' },
  { iso2: 'FM', dialCode: '+691',  label: 'Micronesia (+691)' },
  { iso2: 'MD', dialCode: '+373',  label: 'Moldova (+373)' },
  { iso2: 'MC', dialCode: '+377',  label: 'Monaco (+377)' },
  { iso2: 'MN', dialCode: '+976',  label: 'Mongolia (+976)' },
  { iso2: 'ME', dialCode: '+382',  label: 'Montenegro (+382)' },
  { iso2: 'MS', dialCode: '+1664', label: 'Montserrat (+1664)' },
  { iso2: 'MA', dialCode: '+212',  label: 'Morocco (+212)' },
  { iso2: 'MZ', dialCode: '+258',  label: 'Mozambique (+258)' },
  { iso2: 'MM', dialCode: '+95',   label: 'Myanmar (+95)' },
  { iso2: 'NA', dialCode: '+264',  label: 'Namibia (+264)' },
  { iso2: 'NR', dialCode: '+674',  label: 'Nauru (+674)' },
  { iso2: 'NP', dialCode: '+977',  label: 'Nepal (+977)' },
  { iso2: 'NL', dialCode: '+31',   label: 'Netherlands (+31)' },
  { iso2: 'NC', dialCode: '+687',  label: 'New Caledonia (+687)' },
  { iso2: 'NZ', dialCode: '+64',   label: 'New Zealand (+64)' },
  { iso2: 'NI', dialCode: '+505',  label: 'Nicaragua (+505)' },
  { iso2: 'NE', dialCode: '+227',  label: 'Niger (+227)' },
  { iso2: 'NG', dialCode: '+234',  label: 'Nigeria (+234)' },
  { iso2: 'NU', dialCode: '+683',  label: 'Niue (+683)' },
  { iso2: 'KP', dialCode: '+850',  label: 'North Korea (+850)' },
  { iso2: 'MP', dialCode: '+1670', label: 'Northern Mariana Islands (+1670)' },
  { iso2: 'NO', dialCode: '+47',   label: 'Norway (+47)' },
  { iso2: 'OM', dialCode: '+968',  label: 'Oman (+968)' },
  { iso2: 'PK', dialCode: '+92',   label: 'Pakistan (+92)' },
  { iso2: 'PW', dialCode: '+680',  label: 'Palau (+680)' },
  { iso2: 'PS', dialCode: '+970',  label: 'Palestine (+970)' },
  { iso2: 'PA', dialCode: '+507',  label: 'Panama (+507)' },
  { iso2: 'PG', dialCode: '+675',  label: 'Papua New Guinea (+675)' },
  { iso2: 'PY', dialCode: '+595',  label: 'Paraguay (+595)' },
  { iso2: 'PE', dialCode: '+51',   label: 'Peru (+51)' },
  { iso2: 'PH', dialCode: '+63',   label: 'Philippines (+63)' },
  { iso2: 'PL', dialCode: '+48',   label: 'Poland (+48)' },
  { iso2: 'PT', dialCode: '+351',  label: 'Portugal (+351)' },
  { iso2: 'PR', dialCode: '+1787', label: 'Puerto Rico (+1787)' },
  { iso2: 'QA', dialCode: '+974',  label: 'Qatar (+974)' },
  { iso2: 'CG', dialCode: '+242',  label: 'Republic of the Congo (+242)' },
  { iso2: 'RE', dialCode: '+262',  label: 'Réunion (+262)' },
  { iso2: 'RO', dialCode: '+40',   label: 'Romania (+40)' },
  { iso2: 'RU', dialCode: '+7',    label: 'Russia (+7)' },
  { iso2: 'RW', dialCode: '+250',  label: 'Rwanda (+250)' },
  { iso2: 'BL', dialCode: '+590',  label: 'Saint Barthélemy (+590)' },
  { iso2: 'SH', dialCode: '+290',  label: 'Saint Helena (+290)' },
  { iso2: 'KN', dialCode: '+1869', label: 'Saint Kitts and Nevis (+1869)' },
  { iso2: 'LC', dialCode: '+1758', label: 'Saint Lucia (+1758)' },
  { iso2: 'MF', dialCode: '+590',  label: 'Saint Martin (+590)' },
  { iso2: 'PM', dialCode: '+508',  label: 'Saint Pierre and Miquelon (+508)' },
  { iso2: 'VC', dialCode: '+1784', label: 'Saint Vincent and the Grenadines (+1784)' },
  { iso2: 'WS', dialCode: '+685',  label: 'Samoa (+685)' },
  { iso2: 'SM', dialCode: '+378',  label: 'San Marino (+378)' },
  { iso2: 'ST', dialCode: '+239',  label: 'São Tomé and Príncipe (+239)' },
  { iso2: 'SA', dialCode: '+966',  label: 'Saudi Arabia (+966)' },
  { iso2: 'SN', dialCode: '+221',  label: 'Senegal (+221)' },
  { iso2: 'RS', dialCode: '+381',  label: 'Serbia (+381)' },
  { iso2: 'SC', dialCode: '+248',  label: 'Seychelles (+248)' },
  { iso2: 'SL', dialCode: '+232',  label: 'Sierra Leone (+232)' },
  { iso2: 'SG', dialCode: '+65',   label: 'Singapore (+65)' },
  { iso2: 'SX', dialCode: '+1721', label: 'Sint Maarten (+1721)' },
  { iso2: 'SK', dialCode: '+421',  label: 'Slovakia (+421)' },
  { iso2: 'SI', dialCode: '+386',  label: 'Slovenia (+386)' },
  { iso2: 'SB', dialCode: '+677',  label: 'Solomon Islands (+677)' },
  { iso2: 'SO', dialCode: '+252',  label: 'Somalia (+252)' },
  { iso2: 'ZA', dialCode: '+27',   label: 'South Africa (+27)' },
  { iso2: 'KR', dialCode: '+82',   label: 'South Korea (+82)' },
  { iso2: 'SS', dialCode: '+211',  label: 'South Sudan (+211)' },
  { iso2: 'ES', dialCode: '+34',   label: 'Spain (+34)' },
  { iso2: 'LK', dialCode: '+94',   label: 'Sri Lanka (+94)' },
  { iso2: 'SD', dialCode: '+249',  label: 'Sudan (+249)' },
  { iso2: 'SR', dialCode: '+597',  label: 'Suriname (+597)' },
  { iso2: 'SE', dialCode: '+46',   label: 'Sweden (+46)' },
  { iso2: 'CH', dialCode: '+41',   label: 'Switzerland (+41)' },
  { iso2: 'SY', dialCode: '+963',  label: 'Syria (+963)' },
  { iso2: 'TW', dialCode: '+886',  label: 'Taiwan (+886)' },
  { iso2: 'TJ', dialCode: '+992',  label: 'Tajikistan (+992)' },
  { iso2: 'TZ', dialCode: '+255',  label: 'Tanzania (+255)' },
  { iso2: 'TH', dialCode: '+66',   label: 'Thailand (+66)' },
  { iso2: 'TL', dialCode: '+670',  label: 'Timor-Leste (+670)' },
  { iso2: 'TG', dialCode: '+228',  label: 'Togo (+228)' },
  { iso2: 'TK', dialCode: '+690',  label: 'Tokelau (+690)' },
  { iso2: 'TO', dialCode: '+676',  label: 'Tonga (+676)' },
  { iso2: 'TT', dialCode: '+1868', label: 'Trinidad and Tobago (+1868)' },
  { iso2: 'TN', dialCode: '+216',  label: 'Tunisia (+216)' },
  { iso2: 'TR', dialCode: '+90',   label: 'Turkey (+90)' },
  { iso2: 'TM', dialCode: '+993',  label: 'Turkmenistan (+993)' },
  { iso2: 'TC', dialCode: '+1649', label: 'Turks and Caicos Islands (+1649)' },
  { iso2: 'TV', dialCode: '+688',  label: 'Tuvalu (+688)' },
  { iso2: 'UG', dialCode: '+256',  label: 'Uganda (+256)' },
  { iso2: 'UA', dialCode: '+380',  label: 'Ukraine (+380)' },
  { iso2: 'AE', dialCode: '+971',  label: 'United Arab Emirates (+971)' },
  { iso2: 'GB', dialCode: '+44',   label: 'United Kingdom (+44)' },
  { iso2: 'US', dialCode: '+1',    label: 'United States (+1)' },
  { iso2: 'UY', dialCode: '+598',  label: 'Uruguay (+598)' },
  { iso2: 'UZ', dialCode: '+998',  label: 'Uzbekistan (+998)' },
  { iso2: 'VU', dialCode: '+678',  label: 'Vanuatu (+678)' },
  { iso2: 'VA', dialCode: '+379',  label: 'Vatican City (+379)' },
  { iso2: 'VE', dialCode: '+58',   label: 'Venezuela (+58)' },
  { iso2: 'VN', dialCode: '+84',   label: 'Vietnam (+84)' },
  { iso2: 'WF', dialCode: '+681',  label: 'Wallis and Futuna (+681)' },
  { iso2: 'EH', dialCode: '+212',  label: 'Western Sahara (+212)' },
  { iso2: 'YE', dialCode: '+967',  label: 'Yemen (+967)' },
  { iso2: 'ZM', dialCode: '+260',  label: 'Zambia (+260)' },
  { iso2: 'ZW', dialCode: '+263',  label: 'Zimbabwe (+263)' },
] as const;

/**
 * Converts a raw phone input (with or without country code / spaces / dashes)
 * into E.164 format, defaulting to India (+91) for 10-digit numbers.
 */
export function toE164India(input: string): string {
  // Strip everything except digits
  const digits = input.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // 0-prefixed (Indian trunk prefix): 09876543210
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }

  // Country code already included: 919876543210
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // Country code + trunk prefix: 0919876543210
  if (digits.length === 13 && digits.startsWith('091')) {
    return `+91${digits.slice(3)}`;
  }

  // Input already starts with + — trust it, just clean whitespace
  if (input.trimStart().startsWith('+')) {
    return `+${digits}`;
  }

  // Fallback: prepend +
  return `+${digits}`;
}

/**
 * Converts local phone digits and a selected dial code into E.164.
 */
export function toE164WithCountryCode(localInput: string, dialCode: string): string {
  const localDigits = localInput.replace(/\D/g, '');
  const countryDigits = dialCode.replace(/\D/g, '');
  return `+${countryDigits}${localDigits}`;
}

/** Returns a human-readable masked phone, e.g. "+91 98765 XXXXX" */
export function maskPhone(e164: string): string {
  if (e164.startsWith('+91') && e164.length === 13) {
    return `+91 ${e164.slice(3, 8)} XXXXX`;
  }
  return `${e164.slice(0, 6)}XXXXX`;
}
