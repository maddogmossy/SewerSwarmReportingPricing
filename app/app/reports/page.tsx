import { IDS } from "../lib/ids";

export default function ReportsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 data-uiid={IDS.pages.reports}>Reports</h1>
      <p>This is a placeholder reports page. Replace with your real UI later.</p>

      <table
        data-uiid={IDS.cards.reportsList}
        style={{ borderCollapse: "collapse", width: "100%", marginTop: 16 }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Report</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Daily Summary</td>
            <td>OK</td>
          </tr>
          <tr>
            <td>Aggregates</td>
            <td>OK</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}