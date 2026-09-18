// Asset URLs built at runtime must follow the deployment base, so the site works
// both at the root and under a sub-path such as /safe-lounge/.
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\/+/, '');
