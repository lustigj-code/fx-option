import AccessDeniedView from './view';

const supportEmail =
  process.env.NEXT_PUBLIC_ADMIN_SUPPORT_EMAIL ??
  process.env.ADMIN_SUPPORT_EMAIL ??
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ??
  undefined;

export default function AccessDeniedPage() {
  return <AccessDeniedView supportEmail={supportEmail} />;
}
