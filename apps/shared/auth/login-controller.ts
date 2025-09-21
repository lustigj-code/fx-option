export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginControllerState {
  isSubmitting: boolean;
  errorMessage: string | null;
  formInstance: number;
}

export interface LoginControllerMessages {
  locked: string;
  invalidCredentials: string;
  generic: string;
}

export interface LoginControllerOptions {
  callbackUrl: string;
  signIn: (
    provider: 'credentials',
    payload: {
      email: string;
      password: string;
      redirect: false;
      callbackUrl: string;
    },
  ) => Promise<
    | {
        ok?: boolean;
        error?: string | null;
        status?: number;
        url?: string | null;
      }
    | null
    | undefined
  >;
  onSuccess?: (destination: string) => void;
  onError?: (error: unknown) => void;
  messages: LoginControllerMessages;
}

export interface LoginController {
  submit: (credentials: LoginCredentials) => Promise<void>;
  getSnapshot: () => LoginControllerState;
  subscribe: (listener: (state: LoginControllerState) => void) => () => void;
}

const DEFAULT_STATE: LoginControllerState = {
  isSubmitting: false,
  errorMessage: null,
  formInstance: 0,
};

const ERROR_CODES = {
  locked: 'AccountLocked',
} as const;

export const createLoginController = ({
  callbackUrl,
  signIn,
  onSuccess,
  onError,
  messages,
}: LoginControllerOptions): LoginController => {
  const state: LoginControllerState = { ...DEFAULT_STATE };
  const listeners = new Set<(snapshot: LoginControllerState) => void>();

  const notify = () => {
    const snapshot = { ...state };
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const setState = (partial: Partial<LoginControllerState>) => {
    Object.assign(state, partial);
    notify();
  };

  const submit = async ({ email, password }: LoginCredentials): Promise<void> => {
    setState({ isSubmitting: true, errorMessage: null });

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setState({ errorMessage: messages.generic, isSubmitting: false });
        return;
      }

      if (result.ok) {
        const destination = result.url ?? callbackUrl;
        setState({
          isSubmitting: false,
          errorMessage: null,
          formInstance: state.formInstance + 1,
        });
        if (onSuccess) {
          onSuccess(destination);
        }
        return;
      }

      if (result.error === ERROR_CODES.locked) {
        setState({ errorMessage: messages.locked, isSubmitting: false });
        return;
      }

      setState({ errorMessage: messages.invalidCredentials, isSubmitting: false });
    } catch (error) {
      setState({ errorMessage: messages.generic, isSubmitting: false });
      if (onError) {
        onError(error);
      } else {
        // eslint-disable-next-line no-console -- surfaced in tests when debugging unexpected errors.
        console.error('Login submission failed', error);
      }
    }
  };

  const subscribe = (listener: (snapshot: LoginControllerState) => void) => {
    listeners.add(listener);
    listener({ ...state });
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    submit,
    getSnapshot: () => ({ ...state }),
    subscribe,
  };
};

