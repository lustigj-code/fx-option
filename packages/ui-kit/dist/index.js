// src/components/Badge.tsx
import * as React from "react";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/Badge.tsx
import { jsx } from "react/jsx-runtime";
var Badge = React.forwardRef(
  ({ className, tone = "accent", ...props }, ref) => {
    const tones = {
      accent: "bg-accent/15 text-accent border border-accent/40",
      muted: "bg-accent-muted/40 text-text border border-accent-muted/60"
    };
    return /* @__PURE__ */ jsx(
      "span",
      {
        ref,
        className: cn(
          "inline-flex items-center rounded-full px-4 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur-sm",
          tones[tone],
          className
        ),
        ...props
      }
    );
  }
);
Badge.displayName = "Badge";

// src/components/Button.tsx
import * as React2 from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { jsx as jsx2 } from "react/jsx-runtime";
var buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-accent text-background shadow-soft hover:shadow-glow hover:-translate-y-0.5",
        secondary: "bg-card text-text border border-accent-muted/40 hover:border-accent hover:-translate-y-0.5",
        ghost: "bg-transparent text-muted hover:text-text hover:bg-accent-muted/30 hover:-translate-y-0.5",
        danger: "bg-danger text-background shadow-[0_20px_45px_-25px_rgba(255,77,77,0.35)] hover:shadow-[0_0_25px_0_rgba(255,77,77,0.55)] hover:-translate-y-0.5"
      },
      size: {
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-3 text-sm",
        lg: "px-6 py-3.5 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);
var Button = React2.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx2(
      Comp,
      {
        className: cn(buttonVariants({ variant, size }), className),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// src/components/Card.tsx
import * as React3 from "react";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var Card = React3.forwardRef(
  ({ className, header, footer, children, ...props }, ref) => /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: cn(
        "glass-card flex flex-col gap-4 rounded-2xl p-6 shadow-soft backdrop-blur-xl",
        className
      ),
      ...props,
      children: [
        header && /* @__PURE__ */ jsx3("div", { className: "text-sm font-medium text-muted", children: header }),
        /* @__PURE__ */ jsx3("div", { className: "flex-1 text-base text-text", children }),
        footer && /* @__PURE__ */ jsx3("div", { className: "pt-2 text-xs text-muted", children: footer })
      ]
    }
  )
);
Card.displayName = "Card";

// src/components/Form.tsx
import * as React4 from "react";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var Form = React4.forwardRef(
  ({ className, title, description, fields, submitLabel = "Submit", children, ...props }, ref) => /* @__PURE__ */ jsxs2(
    "form",
    {
      ref,
      className: cn(
        "space-y-6 rounded-2xl border border-accent-muted/30 bg-card/70 p-6 shadow-soft backdrop-blur-xl",
        className
      ),
      ...props,
      children: [
        (title || description) && /* @__PURE__ */ jsxs2("div", { className: "space-y-2", children: [
          title && /* @__PURE__ */ jsx4("h3", { className: "text-xl font-semibold text-text", children: title }),
          description && /* @__PURE__ */ jsx4("p", { className: "text-sm text-muted", children: description })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "space-y-4", children: fields.map((field) => {
          var _a;
          return /* @__PURE__ */ jsxs2("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsx4("label", { htmlFor: field.name, className: "text-xs uppercase tracking-wide text-muted", children: field.label }),
            /* @__PURE__ */ jsx4(
              "input",
              {
                id: field.name,
                name: field.name,
                type: (_a = field.type) != null ? _a : "text",
                placeholder: field.placeholder,
                className: "rounded-2xl border border-accent-muted/40 bg-background/80 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
              }
            ),
            field.helperText && /* @__PURE__ */ jsx4("span", { className: "text-xs text-muted", children: field.helperText })
          ] }, field.name);
        }) }),
        /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-3", children: [
          children,
          /* @__PURE__ */ jsx4(Button, { type: "submit", className: "ml-auto", children: submitLabel })
        ] })
      ]
    }
  )
);
Form.displayName = "Form";

// src/components/Hero.tsx
import * as React5 from "react";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var Hero = React5.forwardRef(
  ({
    className,
    headline,
    subheadline,
    badges = [],
    primaryCta,
    secondaryCta,
    media,
    ...props
  }, ref) => /* @__PURE__ */ jsx5(
    "section",
    {
      ref,
      className: cn(
        "relative overflow-hidden rounded-2xl border border-accent-muted/30 bg-background px-8 py-12 shadow-soft",
        "bg-radial-emerald before:pointer-events-none before:absolute before:inset-0 before:bg-noise-overlay before:opacity-60 before:content-['']",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxs3("div", { className: "relative z-10 flex flex-col gap-8 md:flex-row md:items-center", children: [
        /* @__PURE__ */ jsxs3("div", { className: "flex-1 space-y-6", children: [
          /* @__PURE__ */ jsx5("div", { className: "flex flex-wrap gap-3", children: badges.map((badge) => /* @__PURE__ */ jsx5(Badge, { tone: "accent", children: badge }, badge)) }),
          /* @__PURE__ */ jsx5("h1", { className: "text-4xl font-bold tracking-tight text-text md:text-5xl", children: headline }),
          /* @__PURE__ */ jsx5("p", { className: "max-w-xl text-base text-muted md:text-lg", children: subheadline }),
          /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap gap-4", children: [
            primaryCta && /* @__PURE__ */ jsx5(Button, { onClick: primaryCta.onClick, children: primaryCta.label }),
            secondaryCta && /* @__PURE__ */ jsx5(Button, { variant: "ghost", onClick: secondaryCta.onClick, children: secondaryCta.label })
          ] })
        ] }),
        media && /* @__PURE__ */ jsx5("div", { className: "flex-1", children: media })
      ] })
    }
  )
);
Hero.displayName = "Hero";

// src/components/KPIBar.tsx
import * as React6 from "react";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
var KPIBar = React6.forwardRef(
  ({ className, label, value, target = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.round(value / target * 100));
    return /* @__PURE__ */ jsxs4("div", { ref, className: cn("flex flex-col gap-2", className), ...props, children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between text-xs uppercase tracking-wide text-muted", children: [
        /* @__PURE__ */ jsx6("span", { children: label }),
        /* @__PURE__ */ jsxs4("span", { className: "text-text", children: [
          percentage,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx6("div", { className: "h-3 rounded-full bg-accent-muted/40", children: /* @__PURE__ */ jsx6(
        "div",
        {
          className: "h-full rounded-full bg-gradient-to-r from-accent to-accent/80 shadow-glow",
          style: { width: `${percentage}%` }
        }
      ) })
    ] });
  }
);
KPIBar.displayName = "KPIBar";

// src/components/Navbar.tsx
import * as React7 from "react";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
var Navbar = React7.forwardRef(
  ({ className, logo, links = [], ctaLabel = "Get started", onCtaClick, ...props }, ref) => /* @__PURE__ */ jsxs5(
    "nav",
    {
      ref,
      className: cn(
        "flex items-center justify-between rounded-2xl border border-accent-muted/30 bg-card/80 px-6 py-4 shadow-soft backdrop-blur-xl",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx7("div", { className: "flex items-center gap-3 text-sm font-semibold text-text", children: logo }),
        /* @__PURE__ */ jsx7("div", { className: "hidden items-center gap-6 text-sm text-muted md:flex", children: links.map((link) => /* @__PURE__ */ jsx7("a", { href: link.href, className: "transition hover:text-text", children: link.label }, link.href)) }),
        /* @__PURE__ */ jsx7("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx7(Button, { variant: "secondary", size: "sm", onClick: onCtaClick, children: ctaLabel }) })
      ]
    }
  )
);
Navbar.displayName = "Navbar";

// src/components/Stat.tsx
import * as React8 from "react";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
var Stat = React8.forwardRef(
  ({ className, label, value, trend, ...props }, ref) => /* @__PURE__ */ jsxs6(
    "div",
    {
      ref,
      className: cn(
        "flex flex-col gap-1 rounded-2xl border border-accent-muted/30 bg-card/60 px-4 py-3 text-left shadow-soft",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx8("span", { className: "text-xs uppercase tracking-wide text-muted", children: label }),
        /* @__PURE__ */ jsx8("span", { className: "text-2xl font-semibold text-text", children: value }),
        trend && /* @__PURE__ */ jsx8(
          "span",
          {
            className: cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-accent" : "text-danger"
            ),
            children: /* @__PURE__ */ jsxs6("span", { children: [
              trend.direction === "up" ? "\u25B2" : "\u25BC",
              " ",
              trend.value
            ] })
          }
        )
      ]
    }
  )
);
Stat.displayName = "Stat";

// src/components/Table.tsx
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function Table({ className, columns, data, ...props }) {
  return /* @__PURE__ */ jsx9("div", { className: cn("overflow-hidden rounded-2xl border border-accent-muted/30 bg-card/80 shadow-soft", className), children: /* @__PURE__ */ jsxs7("table", { className: "min-w-full divide-y divide-accent-muted/30", ...props, children: [
    /* @__PURE__ */ jsx9("thead", { className: "bg-card/60 text-left text-xs uppercase tracking-wide text-muted", children: /* @__PURE__ */ jsx9("tr", { children: columns.map((column) => /* @__PURE__ */ jsx9("th", { className: "px-4 py-3", children: column.header }, String(column.key))) }) }),
    /* @__PURE__ */ jsx9("tbody", { className: "divide-y divide-accent-muted/10 text-sm text-text", children: data.map((row, index) => /* @__PURE__ */ jsx9("tr", { className: "hover:bg-accent-muted/10", children: columns.map((column) => /* @__PURE__ */ jsx9("td", { className: "px-4 py-3 text-muted", children: column.render ? column.render(row[column.key], row) : row[column.key] }, String(column.key))) }, index)) })
  ] }) });
}

// src/components/TestimonialStrip.tsx
import * as React9 from "react";
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
var TestimonialStrip = React9.forwardRef(
  ({ className, testimonials, heading = "Loved by industry leaders", ...props }, ref) => /* @__PURE__ */ jsxs8("section", { ref, className: cn("space-y-6", className), ...props, children: [
    /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx10("h2", { className: "text-lg font-semibold text-text", children: heading }),
      /* @__PURE__ */ jsx10("div", { className: "h-px flex-1 bg-accent-muted/40 ml-6" })
    ] }),
    /* @__PURE__ */ jsx10("div", { className: "grid gap-4 md:grid-cols-3", children: testimonials.map((testimonial) => /* @__PURE__ */ jsxs8(
      "div",
      {
        className: "glass-card rounded-2xl border border-accent-muted/30 p-4 text-sm text-muted shadow-soft",
        children: [
          /* @__PURE__ */ jsxs8("p", { className: "text-base text-text", children: [
            "\u201C",
            testimonial.quote,
            "\u201D"
          ] }),
          /* @__PURE__ */ jsxs8("div", { className: "mt-4 text-xs uppercase tracking-wide text-muted", children: [
            /* @__PURE__ */ jsx10("span", { className: "text-text", children: testimonial.author }),
            testimonial.role && /* @__PURE__ */ jsxs8("span", { className: "text-muted", children: [
              " \xB7 ",
              testimonial.role
            ] })
          ] })
        ]
      },
      testimonial.quote
    )) })
  ] })
);
TestimonialStrip.displayName = "TestimonialStrip";

// src/components/Toast.tsx
import * as React10 from "react";
import { jsx as jsx11, jsxs as jsxs9 } from "react/jsx-runtime";
var Toast = React10.forwardRef(
  ({ className, title, description, status = "default", action, ...props }, ref) => {
    const tone = {
      default: "border-accent-muted/40 bg-card/80 text-text",
      success: "border-accent/40 bg-accent-muted/30 text-accent",
      danger: "border-danger/40 bg-danger/15 text-danger"
    }[status];
    return /* @__PURE__ */ jsxs9(
      "div",
      {
        ref,
        className: cn(
          "flex items-start gap-4 rounded-2xl border px-5 py-4 shadow-soft backdrop-blur-xl",
          tone,
          className
        ),
        role: "status",
        ...props,
        children: [
          /* @__PURE__ */ jsxs9("div", { className: "flex-1 space-y-1", children: [
            /* @__PURE__ */ jsx11("p", { className: "text-sm font-semibold", children: title }),
            description && /* @__PURE__ */ jsx11("p", { className: "text-xs text-muted", children: description })
          ] }),
          action
        ]
      }
    );
  }
);
Toast.displayName = "Toast";

// src/components/auth/LoginForm.tsx
import { useState } from "react";
import { jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
var defaultTitle = "Sign in to continue";
var defaultSubtitle = "Access is restricted to authorised FX Portal users. Credentials rotate every 90 days.";
var defaultRememberDeviceLabel = "Remember device for 30 days";
var defaultSubmitLabel = "Sign in";
function LoginForm({
  className,
  onSubmit,
  initialEmail = "",
  title = defaultTitle,
  subtitle = defaultSubtitle,
  pending = false,
  error,
  supportEmail,
  rememberDeviceLabel = defaultRememberDeviceLabel,
  submitLabel = defaultSubmitLabel,
  ...formProps
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit({
      email,
      password,
      rememberDevice
    });
  };
  return /* @__PURE__ */ jsxs10(
    "form",
    {
      onSubmit: handleSubmit,
      className: cn(
        "space-y-6 rounded-3xl border border-accent-muted/30 bg-card/80 p-8 shadow-soft backdrop-blur-xl",
        "transition-shadow duration-200 hover:shadow-accent/20",
        className
      ),
      "aria-busy": pending,
      ...formProps,
      children: [
        /* @__PURE__ */ jsxs10("div", { className: "space-y-2 text-center", children: [
          /* @__PURE__ */ jsx12("h1", { className: "text-2xl font-semibold text-text", children: title }),
          subtitle ? /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted", children: subtitle }) : null
        ] }),
        /* @__PURE__ */ jsxs10("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs10("div", { className: "flex flex-col gap-2 text-left", children: [
            /* @__PURE__ */ jsx12("label", { htmlFor: "email", className: "text-xs font-semibold uppercase tracking-wide text-muted", children: "Email" }),
            /* @__PURE__ */ jsx12(
              "input",
              {
                id: "email",
                name: "email",
                type: "email",
                autoComplete: "email",
                className: "rounded-2xl border border-accent-muted/40 bg-background/90 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50",
                value: email,
                onChange: (event) => setEmail(event.target.value),
                disabled: pending,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs10("div", { className: "flex flex-col gap-2 text-left", children: [
            /* @__PURE__ */ jsx12("label", { htmlFor: "password", className: "text-xs font-semibold uppercase tracking-wide text-muted", children: "Password" }),
            /* @__PURE__ */ jsx12(
              "input",
              {
                id: "password",
                name: "password",
                type: "password",
                autoComplete: "current-password",
                className: "rounded-2xl border border-accent-muted/40 bg-background/90 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50",
                value: password,
                onChange: (event) => setPassword(event.target.value),
                disabled: pending,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs10("label", { className: "flex items-center gap-3 text-left text-sm text-muted", children: [
            /* @__PURE__ */ jsx12(
              "input",
              {
                id: "remember-device",
                name: "remember-device",
                type: "checkbox",
                className: "h-4 w-4 rounded border border-accent-muted/40 bg-background/80 text-accent focus:ring-accent/60",
                checked: rememberDevice,
                onChange: (event) => setRememberDevice(event.target.checked),
                disabled: pending
              }
            ),
            /* @__PURE__ */ jsx12("span", { children: rememberDeviceLabel })
          ] })
        ] }),
        error ? /* @__PURE__ */ jsx12(
          "div",
          {
            role: "alert",
            className: "rounded-2xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-200",
            children: error
          }
        ) : null,
        /* @__PURE__ */ jsx12(
          Button,
          {
            type: "submit",
            className: "w-full",
            disabled: pending,
            children: pending ? "Signing in\u2026" : submitLabel
          }
        ),
        supportEmail ? /* @__PURE__ */ jsxs10("p", { className: "text-center text-xs text-muted", children: [
          "Trouble signing in?",
          " ",
          /* @__PURE__ */ jsx12(
            "a",
            {
              className: "font-medium text-accent hover:underline",
              href: `mailto:${supportEmail}`,
              children: "Contact support"
            }
          ),
          "."
        ] }) : null
      ]
    }
  );
}

// src/components/auth/AccessDeniedBanner.tsx
import { jsx as jsx13, jsxs as jsxs11 } from "react/jsx-runtime";
var defaultTitle2 = "Access denied";
var defaultDescription = "You do not have permission to view this resource.";
function AccessDeniedBanner({
  title = defaultTitle2,
  description = defaultDescription,
  actionLabel = "Request access",
  onRequestAccess,
  supportEmail,
  className,
  children
}) {
  return /* @__PURE__ */ jsxs11(
    "div",
    {
      className: cn(
        "space-y-4 rounded-3xl border border-amber-400/30 bg-amber-950/40 p-6 text-amber-100 shadow-soft",
        className
      ),
      role: "status",
      "aria-live": "polite",
      children: [
        /* @__PURE__ */ jsxs11("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx13("h2", { className: "text-xl font-semibold text-amber-50", children: title }),
          typeof description === "string" ? /* @__PURE__ */ jsx13("p", { className: "text-sm text-amber-100/90", children: description }) : description
        ] }),
        children,
        /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap items-center gap-3", children: [
          onRequestAccess ? /* @__PURE__ */ jsx13(Button, { type: "button", variant: "secondary", onClick: onRequestAccess, children: actionLabel }) : null,
          supportEmail ? /* @__PURE__ */ jsx13(
            "a",
            {
              className: "text-sm font-medium text-amber-200 underline-offset-4 hover:underline",
              href: `mailto:${supportEmail}`,
              children: "Contact compliance"
            }
          ) : null
        ] })
      ]
    }
  );
}

// src/components/auth/MfaPrompt.tsx
import { useState as useState2 } from "react";
import { jsx as jsx14, jsxs as jsxs12 } from "react/jsx-runtime";
var defaultTitle3 = "Multi-factor authentication";
var defaultDescription2 = "Enter the verification code from your authenticator device.";
function MfaPrompt({
  className,
  onSubmit,
  pending = false,
  error,
  supportEmail,
  onUseRecoveryCode,
  onResendCode,
  title = defaultTitle3,
  description = defaultDescription2,
  ...formProps
}) {
  const [code, setCode] = useState2("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit(code);
  };
  return /* @__PURE__ */ jsxs12(
    "form",
    {
      onSubmit: handleSubmit,
      className: cn(
        "space-y-6 rounded-3xl border border-accent-muted/30 bg-card/80 p-6 shadow-soft backdrop-blur-xl",
        className
      ),
      "aria-busy": pending,
      ...formProps,
      children: [
        /* @__PURE__ */ jsxs12("div", { className: "space-y-2 text-center", children: [
          /* @__PURE__ */ jsx14("h2", { className: "text-xl font-semibold text-text", children: title }),
          /* @__PURE__ */ jsx14("p", { className: "text-sm text-muted", children: description })
        ] }),
        /* @__PURE__ */ jsxs12("div", { className: "space-y-2 text-left", children: [
          /* @__PURE__ */ jsx14("label", { htmlFor: "mfa-code", className: "text-xs font-semibold uppercase tracking-wide text-muted", children: "Verification code" }),
          /* @__PURE__ */ jsx14(
            "input",
            {
              id: "mfa-code",
              name: "mfa-code",
              inputMode: "numeric",
              autoComplete: "one-time-code",
              className: "rounded-2xl border border-accent-muted/40 bg-background/90 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50",
              value: code,
              onChange: (event) => setCode(event.target.value.replace(/\s+/g, "")),
              disabled: pending,
              required: true
            }
          )
        ] }),
        error ? /* @__PURE__ */ jsx14(
          "div",
          {
            role: "alert",
            className: "rounded-2xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-200",
            children: error
          }
        ) : null,
        /* @__PURE__ */ jsxs12("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs12("div", { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx14(Button, { type: "submit", disabled: pending, children: pending ? "Verifying\u2026" : "Verify code" }),
            onResendCode ? /* @__PURE__ */ jsx14(Button, { type: "button", variant: "ghost", onClick: onResendCode, disabled: pending, children: "Resend code" }) : null
          ] }),
          onUseRecoveryCode ? /* @__PURE__ */ jsx14(
            Button,
            {
              type: "button",
              variant: "ghost",
              className: "px-0 text-sm font-semibold text-accent hover:underline",
              onClick: onUseRecoveryCode,
              children: "Use recovery code"
            }
          ) : null
        ] }),
        supportEmail ? /* @__PURE__ */ jsxs12("p", { className: "text-center text-xs text-muted", children: [
          "Need help?",
          " ",
          /* @__PURE__ */ jsx14("a", { className: "font-medium text-accent hover:underline", href: `mailto:${supportEmail}`, children: "Contact compliance" }),
          "."
        ] }) : null
      ]
    }
  );
}

// src/styles.ts
var theme = {
  colors: {
    background: "#0b0f0c",
    card: "#0f1511",
    accent: "#2df07d",
    accentMuted: "#1e3f2c",
    text: "#e8f3ec",
    muted: "#9db8a6",
    danger: "#ff4d4d"
  },
  radii: {
    large: "1.5rem"
  },
  shadows: {
    soft: "0 20px 45px -25px rgba(45, 240, 125, 0.35)",
    glow: "0 0 25px 0 rgba(45, 240, 125, 0.55)"
  }
};
export {
  AccessDeniedBanner,
  Badge,
  Button,
  Card,
  Form,
  Hero,
  KPIBar,
  LoginForm,
  MfaPrompt,
  Navbar,
  Stat,
  Table,
  TestimonialStrip,
  Toast,
  buttonVariants,
  theme
};
//# sourceMappingURL=index.js.map