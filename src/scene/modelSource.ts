const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/') + 'models/';
export const modelUrl = (name: string) => `${BASE}${name}.glb`;
