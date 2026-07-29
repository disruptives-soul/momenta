const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error(
    "Momenta uses pnpm only. Run `pnpm install` or `pnpm.cmd install` on Windows PowerShell.",
  );
  process.exit(1);
}
