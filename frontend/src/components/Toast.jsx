import { useEffect, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };
  return { toast, show };
}

export default function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type === 'error' ? '#991b1b' : '#0a0a0a';
  return (
    <div className="toast" style={{ background: bg }}>
      {toast.type === 'success' ? '✓ ' : '✕ '}
      {toast.msg}
    </div>
  );
}
