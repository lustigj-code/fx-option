"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AccessDeniedBanner: () => AccessDeniedBanner,
  Badge: () => Badge,
  Button: () => Button,
  Card: () => Card,
  Form: () => Form,
  Hero: () => Hero,
  KPIBar: () => KPIBar,
  LoginForm: () => LoginForm,
  MfaPrompt: () => MfaPrompt,
  Navbar: () => Navbar,
  Stat: () => Stat,
  Table: () => Table,
  TestimonialStrip: () => TestimonialStrip,
  Toast: () => Toast,
  buttonVariants: () => buttonVariants,
  theme: () => theme
});
module.exports = __toCommonJS(src_exports);

// src/components/Badge.tsx
var React = __toESM(require("react"), 1);

// src/lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// src/components/Badge.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var Badge = React.forwardRef(
  ({ className, tone = "accent", ...props }, ref) => {
    const tones = {
      accent: "bg-accent/15 text-accent border border-accent/40",
      muted: "bg-accent-muted/40 text-text border border-accent-muted/60"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
var React2 = __toESM(require("react"), 1);
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority = require("class-variance-authority");
var import_jsx_runtime2 = require("react/jsx-runtime");
var buttonVariants = (0, import_class_variance_authority.cva)(
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
    const Comp = asChild ? import_react_slot.Slot : "button";
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
var React3 = __toESM(require("react"), 1);
var import_jsx_runtime3 = require("react/jsx-runtime");
var Card = React3.forwardRef(
  ({ className, header, footer, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      ref,
      className: cn(
        "glass-card flex flex-col gap-4 rounded-2xl p-6 shadow-soft backdrop-blur-xl",
        className
      ),
      ...props,
      children: [
        header && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-sm font-medium text-muted", children: header }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "flex-1 text-base text-text", children }),
        footer && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pt-2 text-xs text-muted", children: footer })
      ]
    }
  )
);
Card.displayName = "Card";

// src/components/Form.tsx
var React4 = __toESM(require("react"), 1);
var import_jsx_runtime4 = require("react/jsx-runtime");
var Form = React4.forwardRef(
  ({ className, title, description, fields, submitLabel = "Submit", children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "form",
    {
      ref,
      className: cn(
        "space-y-6 rounded-2xl border border-accent-muted/30 bg-card/70 p-6 shadow-soft backdrop-blur-xl",
        className
      ),
      ...props,
      children: [
        (title || description) && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "space-y-2", children: [
          title && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: "text-xl font-semibold text-text", children: title }),
          description && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm text-muted", children: description })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "space-y-4", children: fields.map((field) => {
          var _a;
          return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { htmlFor: field.name, className: "text-xs uppercase tracking-wide text-muted", children: field.label }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "input",
              {
                id: field.name,
                name: field.name,
                type: (_a = field.type) != null ? _a : "text",
                placeholder: field.placeholder,
                className: "rounded-2xl border border-accent-muted/40 bg-background/80 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
              }
            ),
            field.helperText && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs text-muted", children: field.helperText })
          ] }, field.name);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [
          children,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Button, { type: "submit", className: "ml-auto", children: submitLabel })
        ] })
      ]
    }
  )
);
Form.displayName = "Form";

// src/components/Hero.tsx
var React5 = __toESM(require("react"), 1);
var import_jsx_runtime5 = require("react/jsx-runtime");
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
  }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "section",
    {
      ref,
      className: cn(
        "relative overflow-hidden rounded-2xl border border-accent-muted/30 bg-background px-8 py-12 shadow-soft",
        "bg-radial-emerald before:pointer-events-none before:absolute before:inset-0 before:bg-noise-overlay before:opacity-60 before:content-['']",
        className
      ),
      ...props,
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "relative z-10 flex flex-col gap-8 md:flex-row md:items-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex-1 space-y-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex flex-wrap gap-3", children: badges.map((badge) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { tone: "accent", children: badge }, badge)) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h1", { className: "text-4xl font-bold tracking-tight text-text md:text-5xl", children: headline }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "max-w-xl text-base text-muted md:text-lg", children: subheadline }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex flex-wrap gap-4", children: [
            primaryCta && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Button, { onClick: primaryCta.onClick, children: primaryCta.label }),
            secondaryCta && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Button, { variant: "ghost", onClick: secondaryCta.onClick, children: secondaryCta.label })
          ] })
        ] }),
        media && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex-1", children: media })
      ] })
    }
  )
);
Hero.displayName = "Hero";

// src/components/KPIBar.tsx
var React6 = __toESM(require("react"), 1);
var import_jsx_runtime6 = require("react/jsx-runtime");
var KPIBar = React6.forwardRef(
  ({ className, label, value, target = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.round(value / target * 100));
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { ref, className: cn("flex flex-col gap-2", className), ...props, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between text-xs uppercase tracking-wide text-muted", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "text-text", children: [
          percentage,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "h-3 rounded-full bg-accent-muted/40", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
var React7 = __toESM(require("react"), 1);
var import_jsx_runtime7 = require("react/jsx-runtime");
var Navbar = React7.forwardRef(
  ({ className, logo, links = [], ctaLabel = "Get started", onCtaClick, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    "nav",
    {
      ref,
      className: cn(
        "flex items-center justify-between rounded-2xl border border-accent-muted/30 bg-card/80 px-6 py-4 shadow-soft backdrop-blur-xl",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex items-center gap-3 text-sm font-semibold text-text", children: logo }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "hidden items-center gap-6 text-sm text-muted md:flex", children: links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("a", { href: link.href, className: "transition hover:text-text", children: link.label }, link.href)) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "secondary", size: "sm", onClick: onCtaClick, children: ctaLabel }) })
      ]
    }
  )
);
Navbar.displayName = "Navbar";

// src/components/Stat.tsx
var React8 = __toESM(require("react"), 1);
var import_jsx_runtime8 = require("react/jsx-runtime");
var Stat = React8.forwardRef(
  ({ className, label, value, trend, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    "div",
    {
      ref,
      className: cn(
        "flex flex-col gap-1 rounded-2xl border border-accent-muted/30 bg-card/60 px-4 py-3 text-left shadow-soft",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-xs uppercase tracking-wide text-muted", children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-2xl font-semibold text-text", children: value }),
        trend && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "span",
          {
            className: cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-accent" : "text-danger"
            ),
            children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
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
var import_jsx_runtime9 = require("react/jsx-runtime");
function Table({ className, columns, data, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: cn("overflow-hidden rounded-2xl border border-accent-muted/30 bg-card/80 shadow-soft", className), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "min-w-full divide-y divide-accent-muted/30", ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { className: "bg-card/60 text-left text-xs uppercase tracking-wide text-muted", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tr", { children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "px-4 py-3", children: column.header }, String(column.key))) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { className: "divide-y divide-accent-muted/10 text-sm text-text", children: data.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tr", { className: "hover:bg-accent-muted/10", children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "px-4 py-3 text-muted", children: column.render ? column.render(row[column.key], row) : row[column.key] }, String(column.key))) }, index)) })
  ] }) });
}

// src/components/TestimonialStrip.tsx
var React9 = __toESM(require("react"), 1);
var import_jsx_runtime10 = require("react/jsx-runtime");
var TestimonialStrip = React9.forwardRef(
  ({ className, testimonials, heading = "Loved by industry leaders", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { ref, className: cn("space-y-6", className), ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { className: "text-lg font-semibold text-text", children: heading }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "h-px flex-1 bg-accent-muted/40 ml-6" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "grid gap-4 md:grid-cols-3", children: testimonials.map((testimonial) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
      "div",
      {
        className: "glass-card rounded-2xl border border-accent-muted/30 p-4 text-sm text-muted shadow-soft",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "text-base text-text", children: [
            "\u201C",
            testimonial.quote,
            "\u201D"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "mt-4 text-xs uppercase tracking-wide text-muted", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-text", children: testimonial.author }),
            testimonial.role && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "text-muted", children: [
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
var React10 = __toESM(require("react"), 1);
var import_jsx_runtime11 = require("react/jsx-runtime");
var Toast = React10.forwardRef(
  ({ className, title, description, status = "default", action, ...props }, ref) => {
    const tone = {
      default: "border-accent-muted/40 bg-card/80 text-text",
      success: "border-accent/40 bg-accent-muted/30 text-accent",
      danger: "border-danger/40 bg-danger/15 text-danger"
    }[status];
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex-1 space-y-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "text-sm font-semibold", children: title }),
            description && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "text-xs text-muted", children: description })
          ] }),
          action
        ]
      }
    );
  }
);
Toast.displayName = "Toast";

// src/components/auth/LoginForm.tsx
var import_react = require("react");
var import_jsx_runtime12 = require("react/jsx-runtime");
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
  const [email, setEmail] = (0, import_react.useState)(initialEmail);
  const [password, setPassword] = (0, import_react.useState)("");
  const [rememberDevice, setRememberDevice] = (0, import_react.useState)(false);
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
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "space-y-2 text-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h1", { className: "text-2xl font-semibold text-text", children: title }),
          subtitle ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "text-sm text-muted", children: subtitle }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "space-y-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex flex-col gap-2 text-left", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("label", { htmlFor: "email", className: "text-xs font-semibold uppercase tracking-wide text-muted", children: "Email" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex flex-col gap-2 text-left", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("label", { htmlFor: "password", className: "text-xs font-semibold uppercase tracking-wide text-muted", children: "Password" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: "flex items-center gap-3 text-left text-sm text-muted", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: rememberDeviceLabel })
          ] })
        ] }),
        error ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          "div",
          {
            role: "alert",
            className: "rounded-2xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-200",
            children: error
          }
        ) : null,
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          Button,
          {
            type: "submit",
            className: "w-full",
            disabled: pending,
            children: pending ? "Signing in\u2026" : submitLabel
          }
        ),
        supportEmail ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: "text-center text-xs text-muted", children: [
          "Trouble signing in?",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
var import_jsx_runtime13 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
    "div",
    {
      className: cn(
        "space-y-4 rounded-3xl border border-amber-400/30 bg-amber-950/40 p-6 text-amber-100 shadow-soft",
        className
      ),
      role: "status",
      "aria-live": "polite",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "space-y-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { className: "text-xl font-semibold text-amber-50", children: title }),
          typeof description === "string" ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "text-sm text-amber-100/90", children: description }) : description
        ] }),
        children,
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex flex-wrap items-center gap-3", children: [
          onRequestAccess ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { type: "button", variant: "secondary", onClick: onRequestAccess, children: actionLabel }) : null,
          supportEmail ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
var import_react2 = require("react");
var import_jsx_runtime14 = require("react/jsx-runtime");
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
  const [code, setCode] = (0, import_react2.useState)("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit(code);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "space-y-2 text-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h2", { className: "text-xl font-semibold text-text", children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "text-sm text-muted", children: description })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "space-y-2 text-left", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("label", { htmlFor: "mfa-code", className: "text-xs font-semibold uppercase tracking-wide text-muted", children: "Verification code" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
        error ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
          "div",
          {
            role: "alert",
            className: "rounded-2xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-200",
            children: error
          }
        ) : null,
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Button, { type: "submit", disabled: pending, children: pending ? "Verifying\u2026" : "Verify code" }),
            onResendCode ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Button, { type: "button", variant: "ghost", onClick: onResendCode, disabled: pending, children: "Resend code" }) : null
          ] }),
          onUseRecoveryCode ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
        supportEmail ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("p", { className: "text-center text-xs text-muted", children: [
          "Need help?",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("a", { className: "font-medium text-accent hover:underline", href: `mailto:${supportEmail}`, children: "Contact compliance" }),
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.cjs.map