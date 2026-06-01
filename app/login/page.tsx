import LoginForm from "./LoginForm";

const URL_ERROR_MESSAGES: Record<string, string> = {
  invalid_link: "The magic link was invalid or expired. Request a new one.",
};

const URL_SUCCESS_MESSAGES: Record<string, string> = {
  deletion_requested: "Your account deletion has been requested. You have been signed out.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const urlError = error ? (URL_ERROR_MESSAGES[error] ?? error) : undefined;
  const urlMessage = message ? (URL_SUCCESS_MESSAGES[message] ?? message) : undefined;

  return <LoginForm urlError={urlError} urlMessage={urlMessage} />;
}
