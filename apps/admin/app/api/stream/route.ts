import { hedgeOrders, payments, quotes } from '@/lib/data';
import { eventsToday, fetchAuditEvents } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function randomize(base: number, variance: number) {
  const delta = Math.round((Math.random() - 0.5) * variance);
  return Math.max(0, base + delta);
}

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      let baselineEvents: Awaited<ReturnType<typeof fetchAuditEvents>> = [];

      const sendEvent = async () => {
        try {
          baselineEvents = await fetchAuditEvents(50);
        } catch (error) {
          console.error('[admin] failed to refresh audit metrics', error);
        }
        const payload = {
          quotesActive: randomize(quotes.filter((quote) => quote.status === 'Open').length, 2),
          paymentsPending: randomize(payments.filter((payment) => payment.status === 'Pending').length, 1),
          hedgesOpen: randomize(hedgeOrders.filter((order) => order.status !== 'Hedged').length, 1),
          auditsToday: randomize(eventsToday(baselineEvents), 2),
          lastUpdated: formatTime()
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      void (async () => {
        try {
          baselineEvents = await fetchAuditEvents(50);
        } catch (error) {
          console.error('[admin] failed to load initial audit metrics', error);
        }
        await sendEvent();
        interval = setInterval(() => {
          void sendEvent();
        }, 5000);
      })();
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
