// Client-side courtesy gate only. The backend must enforce its own authorization.
(() => {
 const hashes = {
  "engagement": "1050132de4620fec56009d2cf7a266e7fb98d29a084fc2ff6e7d20e6ff931c2a",
  "wedding": "8f701c019579a1c9de8db193b39ddf513b8b24394888efcefa8e1772037471e7",
  "both": "831e2b469162bf6c35e7a5ae54e8b0c243a6caf4b64072ab82bc554486cff322"
};
 window.InvitationAccess = { async resolve(code) {
   const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.trim()));
   const digest = Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
   return Object.keys(hashes).find(kind => hashes[kind] === digest) || null;
 }};
})();
