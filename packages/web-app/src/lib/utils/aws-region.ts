import { AWS_REGION_FALLBACK } from '$lib/config/constants';

/**
 * Resolves AWS region from runtime environment with a safe local fallback.
 *
 * @returns AWS region used by SDK clients.
 */
export function getAwsRegion(): string {
  return process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? AWS_REGION_FALLBACK;
}
