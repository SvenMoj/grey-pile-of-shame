import LoginForm from "./LoginForm";

const URL_ERROR_MESSAGES: Record<string, string> = {
  not_allowed: "That email is not authorized for admin access.",
  invalid_link: "The magic link was invalid or expired. Request a new one.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const urlErrorMsg = error ? (URL_ERROR_MESSAGES[error] ?? error) : undefined;

  return <LoginForm urlError={urlErrorMsg} />;
}
