/**
 * Converts a configured secret id into an IAM policy resource ARN.
 *
 * Accepts either:
 * - Full secret ARN (returned unchanged)
 * - Secret name/id (converted to a Secrets Manager ARN pattern)
 *
 * @param secretId - Secret name/id or full ARN from configuration.
 * @param region - AWS region segment for generated ARNs.
 * @returns Policy resource ARN string or null when malformed.
 */
export function toSecretsManagerResourceArn(
  secretId: string,
  region: string,
): string | null {
  const trimmed = secretId.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("arn:aws:secretsmanager:")) {
    return trimmed;
  }

  // Secrets Manager names support a restricted character set; reject wildcard/meta characters.
  if (!/^[A-Za-z0-9/_+=.@-]+$/.test(trimmed)) {
    return null;
  }

  // Secret ARNs include a generated suffix; trailing wildcard keeps matching stable for name-based ids.
  return `arn:aws:secretsmanager:${region}:*:secret:${trimmed}*`;
}
