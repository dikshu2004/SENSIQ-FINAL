/* ================================================================
   SensiQ — Indian Sign Language (ISL) Fingerspelling Map
   SVG hand shapes for all letters A-Z, numbers 0-9, and space
   ================================================================ */

function handSVG(paths, vb = '0 0 64 64') {
  return `<svg viewBox="${vb}" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--blue)">${paths}</svg>`;
}

export const ISL_MAP = {
  a: {
    sign: handSVG('<rect x="20" y="16" width="24" height="32" rx="8"/><circle cx="18" cy="28" r="4" fill="currentColor"/>'),
    desc: 'Closed fist, thumb at side',
  },
  b: {
    sign: handSVG('<rect x="18" y="22" width="28" height="26" rx="6"/><line x1="22" y1="22" x2="22" y2="8"/><line x1="28" y1="22" x2="28" y2="6"/><line x1="34" y1="22" x2="34" y2="8"/><line x1="40" y1="22" x2="40" y2="10"/>'),
    desc: 'Open palm, fingers together pointing up',
  },
  c: {
    sign: handSVG('<path d="M38 18 C28 12, 18 20, 18 32 C18 44, 28 50, 38 46"/>'),
    desc: 'Curved hand forming C-shape',
  },
  d: {
    sign: handSVG('<rect x="20" y="26" width="24" height="22" rx="8"/><line x1="28" y1="26" x2="28" y2="8"/><circle cx="28" cy="6" r="2" fill="currentColor"/>'),
    desc: 'Index finger up, others curled into fist',
  },
  e: {
    sign: handSVG('<rect x="18" y="20" width="28" height="28" rx="10"/><path d="M22 20 C22 16, 26 16, 26 20"/><path d="M28 20 C28 16, 32 16, 32 20"/><path d="M34 20 C34 16, 38 16, 38 20"/><path d="M40 20 C40 16, 44 16, 44 20"/>'),
    desc: 'Closed fist, fingers bent over',
  },
  f: {
    sign: handSVG('<circle cx="24" cy="36" r="8"/><line x1="28" y1="28" x2="28" y2="10"/><line x1="34" y1="28" x2="34" y2="8"/><line x1="40" y1="28" x2="40" y2="10"/>'),
    desc: 'Thumb and index form circle, other fingers up',
  },
  g: {
    sign: handSVG('<rect x="24" y="24" width="20" height="20" rx="6"/><line x1="24" y1="32" x2="8" y2="32"/><circle cx="6" cy="32" r="2" fill="currentColor"/>'),
    desc: 'Index finger pointing sideways, thumb out',
  },
  h: {
    sign: handSVG('<rect x="22" y="28" width="22" height="20" rx="6"/><line x1="26" y1="28" x2="14" y2="14"/><line x1="34" y1="28" x2="22" y2="14"/>'),
    desc: 'Index and middle finger together, pointing',
  },
  i: {
    sign: handSVG('<rect x="18" y="20" width="24" height="28" rx="8"/><line x1="42" y1="20" x2="42" y2="8"/>'),
    desc: 'Pinky finger extended, fist closed',
  },
  j: {
    sign: handSVG('<rect x="18" y="20" width="24" height="28" rx="8"/><path d="M42 8 L42 16 Q42 20 38 22" fill="none"/><circle cx="42" cy="6" r="2" fill="currentColor"/>'),
    desc: 'Pinky extended, trace J motion downward',
  },
  k: {
    sign: handSVG('<rect x="22" y="32" width="22" height="18" rx="6"/><line x1="26" y1="32" x2="26" y2="10"/><line x1="38" y1="32" x2="38" y2="12"/><line x1="22" y1="38" x2="14" y2="30"/>'),
    desc: 'Index and middle up, thumb between them',
  },
  l: {
    sign: handSVG('<rect x="24" y="28" width="20" height="22" rx="6"/><line x1="28" y1="28" x2="28" y2="8"/><line x1="24" y1="36" x2="10" y2="36"/>'),
    desc: 'L-shape: thumb out, index pointing up',
  },
  m: {
    sign: handSVG('<rect x="16" y="24" width="32" height="24" rx="8"/><path d="M20 24 C20 18, 24 18, 24 24"/><path d="M28 24 C28 18, 32 18, 32 24"/><path d="M36 24 C36 18, 40 18, 40 24"/><circle cx="16" cy="36" r="3" fill="currentColor"/>'),
    desc: 'Three fingers folded over thumb',
  },
  n: {
    sign: handSVG('<rect x="18" y="24" width="28" height="24" rx="8"/><path d="M24 24 C24 18, 28 18, 28 24"/><path d="M32 24 C32 18, 36 18, 36 24"/><circle cx="18" cy="36" r="3" fill="currentColor"/>'),
    desc: 'Two fingers folded over thumb',
  },
  o: {
    sign: handSVG('<ellipse cx="32" cy="32" rx="14" ry="16"/>'),
    desc: 'Fingers and thumb form O-shape',
  },
  p: {
    sign: handSVG('<rect x="22" y="28" width="22" height="18" rx="6"/><line x1="26" y1="28" x2="26" y2="46"/><line x1="38" y1="28" x2="38" y2="48"/><line x1="22" y1="34" x2="14" y2="26"/>'),
    desc: 'K-shape rotated pointing downward',
  },
  q: {
    sign: handSVG('<rect x="22" y="22" width="22" height="18" rx="6"/><line x1="28" y1="40" x2="28" y2="56"/><line x1="22" y1="30" x2="10" y2="42"/>'),
    desc: 'G-shape rotated pointing downward',
  },
  r: {
    sign: handSVG('<rect x="22" y="30" width="22" height="20" rx="6"/><line x1="28" y1="30" x2="34" y2="8"/><line x1="36" y1="30" x2="30" y2="8"/>'),
    desc: 'Index and middle fingers crossed',
  },
  s: {
    sign: handSVG('<rect x="18" y="18" width="28" height="30" rx="10"/><circle cx="32" cy="18" r="3" fill="currentColor"/>'),
    desc: 'Fist with thumb across front of fingers',
  },
  t: {
    sign: handSVG('<rect x="18" y="18" width="28" height="30" rx="10"/><circle cx="26" cy="22" r="3" fill="currentColor"/>'),
    desc: 'Thumb tucked between index and middle finger',
  },
  u: {
    sign: handSVG('<rect x="20" y="28" width="24" height="22" rx="6"/><line x1="26" y1="28" x2="26" y2="8"/><line x1="34" y1="28" x2="34" y2="8"/>'),
    desc: 'Index and middle fingers together pointing up',
  },
  v: {
    sign: handSVG('<rect x="20" y="28" width="24" height="22" rx="6"/><line x1="26" y1="28" x2="18" y2="8"/><line x1="34" y1="28" x2="42" y2="8"/>'),
    desc: 'V-shape: index and middle spread apart',
  },
  w: {
    sign: handSVG('<rect x="18" y="28" width="28" height="22" rx="6"/><line x1="22" y1="28" x2="16" y2="8"/><line x1="32" y1="28" x2="32" y2="6"/><line x1="42" y1="28" x2="48" y2="8"/>'),
    desc: 'Three fingers spread forming W',
  },
  x: {
    sign: handSVG('<rect x="20" y="26" width="24" height="24" rx="8"/><path d="M28 26 L28 14 Q28 8 36 12" fill="none"/>'),
    desc: 'Index finger hooked, others in fist',
  },
  y: {
    sign: handSVG('<rect x="22" y="22" width="20" height="24" rx="6"/><line x1="22" y1="30" x2="8" y2="20"/><line x1="42" y1="30" x2="56" y2="20"/>'),
    desc: 'Thumb and pinky extended, others curled (hang loose)',
  },
  z: {
    sign: handSVG('<rect x="20" y="26" width="24" height="22" rx="8"/><path d="M28 8 L40 8 L28 22 L40 22" fill="none"/>'),
    desc: 'Index finger traces Z in the air',
  },
};
