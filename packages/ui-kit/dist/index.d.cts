import * as React from 'react';
import * as class_variance_authority_dist_types from 'class-variance-authority/dist/types';
import { VariantProps } from 'class-variance-authority';
import * as react_jsx_runtime from 'react/jsx-runtime';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: 'accent' | 'muted';
}
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>>;

type ButtonVariant = VariantProps<typeof buttonVariants>;
declare const buttonVariants: (props?: ({
    variant?: "primary" | "secondary" | "ghost" | "danger" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_dist_types.ClassProp) | undefined) => string;
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariant {
    asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    header?: React.ReactNode;
    footer?: React.ReactNode;
}
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;

interface FormField {
    label: string;
    name: string;
    placeholder?: string;
    type?: string;
    helperText?: string;
}
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    title?: string;
    description?: string;
    fields: FormField[];
    submitLabel?: string;
}
declare const Form: React.ForwardRefExoticComponent<FormProps & React.RefAttributes<HTMLFormElement>>;

interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
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
    media?: React.ReactNode;
}
declare const Hero: React.ForwardRefExoticComponent<HeroProps & React.RefAttributes<HTMLDivElement>>;

interface KPIBarProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    value: number;
    target?: number;
}
declare const KPIBar: React.ForwardRefExoticComponent<KPIBarProps & React.RefAttributes<HTMLDivElement>>;

interface NavbarLink {
    label: string;
    href: string;
}
interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    logo: React.ReactNode;
    links?: NavbarLink[];
    ctaLabel?: string;
    onCtaClick?: () => void;
}
declare const Navbar: React.ForwardRefExoticComponent<NavbarProps & React.RefAttributes<HTMLElement>>;

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    trend?: {
        direction: 'up' | 'down';
        value: string;
    };
}
declare const Stat: React.ForwardRefExoticComponent<StatProps & React.RefAttributes<HTMLDivElement>>;

interface TableColumn<T> {
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
}
interface TableProps<T> extends React.TableHTMLAttributes<HTMLTableElement> {
    columns: TableColumn<T>[];
    data: T[];
}
declare function Table<T>({ className, columns, data, ...props }: TableProps<T>): react_jsx_runtime.JSX.Element;

interface Testimonial {
    quote: string;
    author: string;
    role?: string;
}
interface TestimonialStripProps extends React.HTMLAttributes<HTMLDivElement> {
    testimonials: Testimonial[];
    heading?: string;
}
declare const TestimonialStrip: React.ForwardRefExoticComponent<TestimonialStripProps & React.RefAttributes<HTMLDivElement>>;

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    status?: 'default' | 'success' | 'danger';
    action?: React.ReactNode;
}
declare const Toast: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLDivElement>>;

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

export { Badge, type BadgeProps, Button, type ButtonProps, Card, type CardProps, Form, type FormField, type FormProps, Hero, type HeroProps, KPIBar, type KPIBarProps, Navbar, type NavbarLink, type NavbarProps, Stat, type StatProps, Table, type TableColumn, type TableProps, type Testimonial, TestimonialStrip, type TestimonialStripProps, Toast, type ToastProps, buttonVariants, theme };
