import NodeCache from 'node-cache';

export const categoryCache = new NodeCache({
  stdTTL: 3600, // 60 minutes default TTL
  checkperiod: 120,
});
