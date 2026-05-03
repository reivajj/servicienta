import type { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';
import { extractBearerToken } from '../core/auth.js';
import { requireAdminUser } from '../users/service.js';

const openApiYamlPath = new URL('../../docs/openapi.yaml', import.meta.url);
const openApiYaml = readFileSync(openApiYamlPath, 'utf8');
const openApiSpec = parseYaml(openApiYaml);

interface ApiDocsRouterOptions {
  supabase: SupabaseClient;
}

export function apiDocsRouter(options: ApiDocsRouterOptions) {
  const router = Router();

  const ensureAdmin = createApiDocsAdminMiddleware(options.supabase);

  router.get('/api-docs/openapi.yaml', ensureAdmin, (_request, response) => {
    response.type('application/yaml').send(openApiYaml);
  });

  router.use(
    '/api-docs',
    ensureAdmin,
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'Servicienta API Docs',
      explorer: true,
    }),
  );

  return router;
}

function createApiDocsAdminMiddleware(supabase: SupabaseClient) {
  return async function apiDocsAdminMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    try {
      const accessToken =
        extractBearerToken(request) ??
        readAccessTokenFromQuery(request) ??
        readAccessTokenFromCookie(request);

      await requireAdminUser(supabase, accessToken);

      if (readAccessTokenFromQuery(request)) {
        response.cookie('api_docs_access_token', accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/api-docs',
          maxAge: 1000 * 60 * 30,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function readAccessTokenFromQuery(request: Request): string | null {
  const value = request.query.access_token;

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }

  return null;
}

function readAccessTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.header('cookie');

  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.split('=');
    const name = rawName?.trim();

    if (name !== 'api_docs_access_token') continue;

    const value = rawValueParts.join('=').trim();

    return value ? decodeURIComponent(value) : null;
  }

  return null;
}
