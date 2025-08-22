import Header from "./components/Header";
import Card from "./components/Card";
import { IDS } from "./lib/ids";

export default function Home() {
  return (
    <main
      data-uiid={IDS.pages.home}
      style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}
    >
      <Header />

      <div style={{ display: "grid", gap: 16 }}>
        <Card title="Health check" href="/api/health">
          <div data-uiid={IDS.cards.health}>
            <a
              href="/api/health"
              data-actionid={IDS.actions.refreshHealth}
            >
              Run health check
            </a>
            <p>
              Returns {"{ status: 'ok', db: true }"} if the app and DB are reachable.
            </p>
          </div>
        </Card>

        <Card title="Dashboard" href="/dashboard">
          <div data-uiid={IDS.cards.dashboardSummary}>
            Start migrating UI here. (This can be your next page.)
          </div>
        </Card>

        <Card title="Reports" href="/reports">
          <div data-uiid={IDS.cards.reportsList}>
            See your list of reports and details.
          </div>
        </Card>
      </div>
    </main>
  );
}