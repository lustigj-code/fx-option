'use client';

import MfaVerificationForm from '@/components/auth/MfaVerificationForm';

interface MfaVerificationViewProps {
  verifyEndpoint?: string;
  supportEmail?: string;
  callbackUrl?: string;
}

export default function MfaVerificationView({
  verifyEndpoint,
  supportEmail,
  callbackUrl,
}: MfaVerificationViewProps) {
  return (
    <MfaVerificationForm
      verifyEndpoint={verifyEndpoint}
      supportEmail={supportEmail}
      callbackUrl={callbackUrl}
    />
  );
}
