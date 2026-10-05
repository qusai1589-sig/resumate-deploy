import { handleRequest } from '../../../server/api.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export const GET = handleRequest;
export const POST = handleRequest;
