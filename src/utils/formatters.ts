export const formatBedroomsLabel = (val: string | number, suffix: string = 'Qts') => {
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (lower.includes('qt') || lower.includes('quart') || lower.includes('dorm')) {
    return s;
  }
  return `${s} ${suffix}`;
};

export const formatAreaLabel = (val: string | number) => {
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (lower.includes('m²') || lower.includes('m2') || lower.includes('metr')) {
    return s;
  }
  return `${s} m²`;
};

export const formatParkingLabel = (val: string | number, isShort: boolean = true) => {
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (lower.includes('opcion') || lower === 'opcional') {
    return 'Vaga Opcional';
  }
  if (lower.includes('vag') || lower.includes('vg')) {
    return s;
  }
  const suffix = s === '1' ? (isShort ? 'Vag.' : 'Vaga') : (isShort ? 'Vags.' : 'Vagas');
  return `${s} ${suffix}`;
};

export const formatPropRef = (id: string | number) => {
  const idStr = String(id);
  const match = idStr.match(/\d+/);
  if (match) {
    return match[0].padStart(3, '0');
  }
  return idStr;
};

export const formatBRL = (val: string | number) => {
  if (typeof val === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  }
  
  const num = Number(val);
  if (!isNaN(num) && val.trim() !== '') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  }
  
  return val;
};
