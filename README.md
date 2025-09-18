# fx-option

Execution service for placing CME MXN options on futures in an IBKR paper account.

## Execution service

The `services.execution` package provides:

- mapping from hedge due dates to the nearest contract expiries,
- MXN option contract construction for CME (Globex) trading,
- limit order placement with configurable slippage control via IBKR TWS,
- persistence of submitted orders and fills, and
- emission of `HedgePlaced` events for downstream hedge tracking.

### Usage example

```python
import asyncio
from datetime import datetime

from services.execution import (
    ExecutionConfig,
    ExecutionService,
    HedgeRequest,
    IBKRClient,
)
from services.execution.config import ExecutionPaths
from services.execution.events import InMemoryEventEmitter


async def main():
    config = ExecutionConfig(account="DU1234567", paths=ExecutionPaths())
    event_emitter = InMemoryEventEmitter()
    ib_client = IBKRClient(config)

    service = ExecutionService(config, event_emitter, ib_client)
    async with service:
        await service.place_hedge(
            HedgeRequest(
                due_date=datetime.utcnow(),
                strike=0.055,
                right="C",
                action="BUY",
                quantity=2,
                reference_price=0.0042,
            )
        )

    print(event_emitter.events)


asyncio.run(main())
```

The example assumes an IBKR paper TWS running locally on the default port with MXN option market data/permissions enabled.
