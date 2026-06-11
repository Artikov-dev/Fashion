/* Avatar — initials yoki DiceBear random avatar */
const GRADIENTS = [
  ['#185FA5','#38BDF8'], ['#8B5CF6','#EC4899'], ['#10B981','#38BDF8'],
  ['#F59E0B','#EF4444'], ['#6366F1','#8B5CF6'], ['#EF4444','#F59E0B'],
  ['#14B8A6','#10B981'], ['#EC4899','#8B5CF6'],
];

function strHash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function Avatar({ name, url, size = 'md', className = '' }) {
  const sizes = {
    xs: { px: 24,  text: 9  },
    sm: { px: 32,  text: 11 },
    md: { px: 36,  text: 13 },
    lg: { px: 44,  text: 16 },
    xl: { px: 56,  text: 20 },
  };
  const { px, text } = sizes[size] || sizes.md;

  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const seed = strHash(name || url || 'user');
  const [g1, g2] = GRADIENTS[seed % GRADIENTS.length];

  const style = {
    width: px, height: px, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: text, color: '#fff',
    background: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
    boxShadow: `0 2px 8px ${g1}55`,
    userSelect: 'none',
  };

  if (url) {
    return (
      <img
        src={url} alt={name || ''}
        style={{ ...style, objectFit: 'cover' }}
        className={className}
        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
      />
    );
  }

  // DiceBear avataaars — deterministik, har user uchun har xil
  const diceSrc = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}&backgroundColor=${g1.replace('#','')}&radius=50`;

  return (
    <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }} className={className}>
      <img
        src={diceSrc}
        alt={initials}
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: `linear-gradient(135deg, ${g1}, ${g2})` }}
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
      {/* fallback initials (hidden unless img fails) */}
      <div style={{ ...style, position: 'absolute', inset: 0, display: 'none' }}
        className="avatar-fallback">
        {initials}
      </div>
    </div>
  );
}
