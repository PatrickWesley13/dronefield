export const formatCount = (n: number): string => n.toLocaleString('en-US');
export const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;
