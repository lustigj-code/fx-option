export function formatNotional(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatAmount(value: number, currency: string) {
  const fractionDigits = ['JPY'].includes(currency) ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(value));
}

export function formatRelativeTime(target: string) {
  const diffMs = new Date(target).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
  if (Math.abs(diffMinutes) >= 60) {
    const hours = Math.round(diffMinutes / 60);
    return rtf.format(hours, 'hour');
  }
  return rtf.format(diffMinutes, 'minute');
}
