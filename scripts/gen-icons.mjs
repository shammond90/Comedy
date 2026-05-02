import sharp from '../node_modules/sharp/lib/index.js';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" ry="100" fill="#C8553D"/>
  <rect x="88" y="170" width="148" height="190" rx="12" ry="12" fill="#f8f5f0" opacity="0.95"/>
  <rect x="276" y="170" width="148" height="190" rx="12" ry="12" fill="#f8f5f0" opacity="0.95"/>
  <rect x="244" y="160" width="24" height="210" rx="8" ry="8" fill="#f8f5f0"/>
  <rect x="108" y="210" width="108" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <rect x="108" y="235" width="90" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <rect x="108" y="260" width="100" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <rect x="108" y="285" width="70" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <rect x="296" y="210" width="108" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <rect x="296" y="235" width="80" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <rect x="296" y="260" width="100" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <rect x="296" y="285" width="60" height="10" rx="5" fill="#C8553D" opacity="0.4"/>
  <circle cx="390" cy="122" r="30" fill="#f8f5f0" opacity="0.2"/>
  <circle cx="390" cy="122" r="16" fill="#f8f5f0" opacity="0.5"/>
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).resize(192).png().toFile('./public/icon-192.png');
await sharp(buf).resize(512).png().toFile('./public/icon-512.png');
await sharp(buf).resize(180).png().toFile('./public/apple-touch-icon.png');
console.log('Icons generated');
