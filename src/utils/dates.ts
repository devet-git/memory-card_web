// Same convention as the study streak: ISO (UTC) date string 'YYYY-MM-DD'
export const dateKey = (d: Date | number = new Date()): string => new Date(d).toISOString().split("T")[0];

export const daysAgoKey = (n: number): string => dateKey(Date.now() - n * 86400000);
