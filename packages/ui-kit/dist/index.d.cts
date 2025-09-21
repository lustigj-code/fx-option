import * as React$1 from 'react';
import { ReactNode } from 'react';
import * as class_variance_authority_dist_types from 'class-variance-authority/dist/types';
import { VariantProps } from 'class-variance-authority';
import * as react_jsx_runtime from 'react/jsx-runtime';

interface BadgeProps extends React$1.HTMLAttributes<HTMLSpanElement> {
    tone?: 'accent' | 'muted';
}
declare const Badge: React$1.ForwardRefExoticComponent<BadgeProps & React$1.RefAttributes<HTMLSpanElement>>;

type ButtonVariant = VariantProps<typeof buttonVariants>;
declare const buttonVariants: (props?: ({
    variant?: "primary" | "secondary" | "ghost" | "danger" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_dist_types.ClassProp) | undefined) => string;
interface ButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariant {
    asChild?: boolean;
}
declare const Button: React$1.ForwardRefExoticComponent<ButtonProps & React$1.RefAttributes<HTMLButtonElement>>;

interface CardProps extends React$1.HTMLAttributes<HTMLDivElement> {
    header?: React$1.ReactNode;
    footer?: React$1.ReactNode;
}
declare const Card: React$1.ForwardRefExoticComponent<CardProps & React$1.RefAttributes<HTMLDivElement>>;

interface FormField {
    label: string;
    name: string;
    placeholder?: string;
    type?: string;
    helperText?: string;
}
interface FormProps extends React$1.FormHTMLAttributes<HTMLFormElement> {
    title?: string;
    description?: string;
    fields: FormField[];
    submitLabel?: string;
}
declare const Form: React$1.ForwardRefExoticComponent<FormProps & React$1.RefAttributes<HTMLFormElement>>;

interface HeroProps extends React$1.HTMLAttributes<HTMLDivElement> {
    headline: string;
    subheadline: string;
    badges?: string[];
    primaryCta?: {
        label: string;
        onClick?: () => void;
    };
    secondaryCta?: {
        label: string;
        onClick?: () => void;
    };
    media?: React$1.ReactNode;
}
declare const Hero: React$1.ForwardRefExoticComponent<HeroProps & React$1.RefAttributes<HTMLDivElement>>;

interface KPIBarProps extends React$1.HTMLAttributes<HTMLDivElement> {
    label: string;
    value: number;
    target?: number;
}
declare const KPIBar: React$1.ForwardRefExoticComponent<KPIBarProps & React$1.RefAttributes<HTMLDivElement>>;

interface NavbarLink {
    label: string;
    href: string;
}
interface NavbarProps extends React$1.HTMLAttributes<HTMLElement> {
    logo: React$1.ReactNode;
    links?: NavbarLink[];
    ctaLabel?: string;
    onCtaClick?: () => void;
}
declare const Navbar: React$1.ForwardRefExoticComponent<NavbarProps & React$1.RefAttributes<HTMLElement>>;

interface StatProps extends React$1.HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    trend?: {
        direction: 'up' | 'down';
        value: string;
    };
}
declare const Stat: React$1.ForwardRefExoticComponent<StatProps & React$1.RefAttributes<HTMLDivElement>>;

interface TableColumn<T> {
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React$1.ReactNode;
}
interface TableProps<T> extends React$1.TableHTMLAttributes<HTMLTableElement> {
    columns: TableColumn<T>[];
    data: T[];
}
declare function Table<T>({ className, columns, data, ...props }: TableProps<T>): react_jsx_runtime.JSX.Element;

interface Testimonial {
    quote: string;
    author: string;
    role?: string;
}
interface TestimonialStripProps extends React$1.HTMLAttributes<HTMLDivElement> {
    testimonials: Testimonial[];
    heading?: string;
}
declare const TestimonialStrip: React$1.ForwardRefExoticComponent<TestimonialStripProps & React$1.RefAttributes<HTMLDivElement>>;

interface ToastProps extends React$1.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    status?: 'default' | 'success' | 'danger';
    action?: React$1.ReactNode;
}
declare const Toast: React$1.ForwardRefExoticComponent<ToastProps & React$1.RefAttributes<HTMLDivElement>>;

interface LoginFormValues {
    email: string;
    password: string;
    rememberDevice: boolean;
}
interface LoginFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    /** Callback invoked with the captured credentials. */
    onSubmit: (values: LoginFormValues) => Promise<void> | void;
    /** Initial email value, useful when pre-filling from query params. */
    initialEmail?: string;
    /** Displayed above the form controls. */
    title?: string;
    /** Additional context message below the title. */
    subtitle?: string;
    /** Whether to disable inputs during async submission. */
    pending?: boolean;
    /** Inline error surfaced beneath the password field. */
    error?: string | null;
    /** Optional mailto link rendered for support escalations. */
    supportEmail?: string;
    /** Custom label for the remember device checkbox. */
    rememberDeviceLabel?: string;
    /** Custom label for the submit button. */
    submitLabel?: string;
}
declare function LoginForm({ className, onSubmit, initialEmail, title, subtitle, pending, error, supportEmail, rememberDeviceLabel, submitLabel, ...formProps }: LoginFormProps): react_jsx_runtime.JSX.Element;

interface AccessDeniedBannerProps {
    title?: string;
    description?: ReactNode;
    actionLabel?: string;
    onRequestAccess?: () => void;
    supportEmail?: string;
    className?: string;
    children?: ReactNode;
}
declare function AccessDeniedBanner({ title, description, actionLabel, onRequestAccess, supportEmail, className, children, }: AccessDeniedBannerProps): react_jsx_runtime.JSX.Element;

interface MfaPromptProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    onSubmit: (code: string) => Promise<void> | void;
    pending?: boolean;
    error?: string | null;
    supportEmail?: string;
    onUseRecoveryCode?: () => void;
    onResendCode?: () => void;
    title?: string;
    description?: string;
}
declare function MfaPrompt({ className, onSubmit, pending, error, supportEmail, onUseRecoveryCode, onResendCode, title, description, ...formProps }: MfaPromptProps): react_jsx_runtime.JSX.Element;

declare const theme: {
    colors: {
        background: string;
        card: string;
        accent: string;
        accentMuted: string;
        text: string;
        muted: string;
        danger: string;
    };
    radii: {
        large: string;
    };
    shadows: {
        soft: string;
        glow: string;
    };
};

export { AccessDeniedBanner, type AccessDeniedBannerProps, Badge, type BadgeProps, Button, type ButtonProps, Card, type CardProps, Form, type FormField, type FormProps, Hero, type HeroProps, KPIBar, type KPIBarProps, LoginForm, type LoginFormProps, type LoginFormValues, MfaPrompt, type MfaPromptProps, Navbar, type NavbarLink, type NavbarProps, Stat, type StatProps, Table, type TableColumn, type TableProps, type Testimonial, TestimonialStrip, type TestimonialStripProps, Toast, type ToastProps, buttonVariants, theme };
