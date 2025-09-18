"""Custom exceptions for the Siigo connector."""


class SiigoConnectorError(Exception):
    """Base exception for Siigo connector related issues."""


class AuthenticationError(SiigoConnectorError):
    """Raised when the connector fails to authenticate against Siigo."""


class SubscriptionError(SiigoConnectorError):
    """Raised when a subscription request fails."""
