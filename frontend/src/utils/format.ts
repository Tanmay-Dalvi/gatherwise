export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return `${currency} ${safeAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
}

export function formatEventDate(dateStr?: string): string {
  if (!dateStr) return 'Date flexible / TBD';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getCountdownDays(dateStr?: string): { text: string; isPast: boolean } {
  if (!dateStr) return { text: 'Date TBD', isPast: false };
  try {
    const target = new Date(dateStr).getTime();
    if (isNaN(target)) return { text: 'Date TBD', isPast: false };
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'Today is celebration day! 🎉', isPast: false };
    if (diffDays > 0) return { text: `${diffDays} days away`, isPast: false };
    return { text: `${Math.abs(diffDays)} days ago`, isPast: true };
  } catch {
    return { text: 'Date TBD', isPast: false };
  }
}
