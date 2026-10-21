
/**
 * Calculates expiration status
 */
export function getExpirationStatus(expirationDate, imminentThresholdDays = 3, referenceDateStr) {
    if (!expirationDate)
        return 'unknown';
    const todayStr = referenceDateStr || new Date().toISOString().slice(0, 10);
    if (expirationDate < todayStr)
        return 'expired';
    if (expirationDate === todayStr)
        return 'today';
    const today = new Date(todayStr + 'T00:00:00');
    const target = new Date(expirationDate + 'T00:00:00');
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= imminentThresholdDays) {
        return 'imminent';
    }
    return 'normal';
}