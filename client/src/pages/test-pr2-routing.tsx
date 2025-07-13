// Simple test component to debug PR2 routing
export default function TestPR2Routing() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-green-600">✅ PR2 Test Route Working</h1>
      <p className="text-lg mt-4">This confirms that routing to PR2 pages is working correctly.</p>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Debug Info:</h2>
        <ul className="list-disc ml-6 mt-2">
          <li>Route: /pr2-pricing</li>
          <li>Component: TestPR2Routing</li>
          <li>Status: Working</li>
        </ul>
      </div>
    </div>
  );
}