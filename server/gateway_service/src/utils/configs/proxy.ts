import { createProxyMiddleware } from 'http-proxy-middleware';
import { USER_SERVICE_URL } from '../services/constants';

const createProxy = (
    target: string,
    pathRewrite: Record<string, string>
) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        cookieDomainRewrite: { '*': '' },
        logLevel: 'debug',
        onProxyReq: commonOnProxyReq
    });
};

const commonOnProxyReq = (proxyReq: any, req: IAuthenticatedRequest, res: any) => {
    if (req.userId) {
        proxyReq.setHeader('X-User-ID', req.userId);
    }

    if (req.userRole) {
        proxyReq.setHeader('X-User-Role', req.userRole);
    }

    if (req.body) {
        const contentType = req.headers['content-type'] || '';

        if (
            contentType.includes('application/json') &&
            ['POST', 'PUT', 'PATCH'].includes(req.method || '')
        ) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }
}

export const userProxy = createProxy(USER_SERVICE_URL, { '^/api/user': '/api' });