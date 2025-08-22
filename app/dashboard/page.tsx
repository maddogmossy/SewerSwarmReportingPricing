import { IDS } from "../lib/ids";

export default function DashboardPage() {
  return (
    <main
      data-uiid={IDS.pages.dashboard}
      style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}
    >
      <h1>Dashboard</h1>
      <p>This is your clean placeholder dashboard page.</p>
    </main>
  );
}