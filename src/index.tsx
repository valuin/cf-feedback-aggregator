import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { feedbackEntries } from "./db/schema";
import { FeedbackEntry, FeedbackSource } from "./types";
import { FC } from "hono/jsx";

const app = new Hono<{ Bindings: CloudflareBindings }>();

const Layout: FC = (props) => (
  <html>
    <head>
      <title>Feedback Aggregator</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 min-h-screen p-8">{props.children}</body>
  </html>
);

const Dashboard: FC<{ feedback: FeedbackEntry[] }> = ({ feedback }) => {
  const urgentCount = feedback.filter(
    (f) => f.urgency === "critical" || f.urgency === "high",
  ).length;
  const topCategories = Object.entries(
    feedback.reduce(
      (acc, f) => {
        if (f.category) acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Layout>
      <div class="max-w-6xl mx-auto">
        <header class="mb-12">
          <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Feedback Signal Aggregator
          </h1>
          <p class="text-lg text-gray-600">
            Extracting actionable product signals from fragmented channels.
          </p>
        </header>

        {/* Priority Insights Cards */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-sm font-medium text-gray-500 uppercase mb-1">Total Signals</div>
            <div class="text-3xl font-bold text-blue-600">{feedback.length}</div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-sm font-medium text-gray-500 uppercase mb-1">Urgent/Critical</div>
            <div class="text-3xl font-bold text-red-600">{urgentCount}</div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-sm font-medium text-gray-500 uppercase mb-1">Top Themes</div>
            <div class="flex gap-2 mt-2">
              {topCategories.map(([cat]) => (
                <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                  {cat}
                </span>
              ))}
              {topCategories.length === 0 && (
                <span class="text-xs text-gray-400 italic">None yet</span>
              )}
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold text-gray-800">Urgent + Negative Priority Queue</h2>
            {urgentCount > 0 && (
              <span class="flex h-3 w-3 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <span class="text-xs text-gray-400">
            Filtered by Sentiment: Negative AND Urgency: High/Critical
          </span>
        </div>

        <div class="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Origin
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Raw Signal
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              {feedback.length === 0 ? (
                <tr>
                  <td colspan={4} class="px-6 py-12 text-center text-gray-500 italic">
                    No urgent negative signals found. The system is quiet.
                  </td>
                </tr>
              ) : (
                feedback.map((f) => (
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-slate-100 text-slate-700 uppercase">
                        {f.source}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700 leading-relaxed max-w-md">
                      {f.rawText}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md ${
                          f.urgency === "critical"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {f.urgency}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-xs font-medium text-gray-900">
                        {f.category || "Uncategorized"}
                      </div>
                      <div class="text-[10px] text-gray-400 uppercase">{f.sentiment}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  let results: (typeof feedbackEntries.$inferSelect)[] = [];
  try {
    results = await db.select().from(feedbackEntries).all();
  } catch (e) {
    console.error(`[D1 Error]`, e);
  }

  // Debug: Log results to terminal
  console.log(`[D1 Query] Raw entries found:`, JSON.stringify(results, null, 2));

  // Filter for signals
  const signals: FeedbackEntry[] = results
    .map((r) => ({
      id: r.id,
      source: r.source as FeedbackSource,
      rawText: r.rawText,
      sentiment: (r.sentiment?.toLowerCase() || "") as FeedbackEntry["sentiment"],
      urgency: (r.urgency?.toLowerCase() || "") as FeedbackEntry["urgency"],
      category: r.category ?? undefined,
      createdAt: r.createdAt || undefined,
    }))
    .filter(
      (r) => (r.urgency === "high" || r.urgency === "critical") && r.sentiment === "negative",
    );

  console.log(`[D1 Query] Signals found after filtering:`, JSON.stringify(signals, null, 2));

  return c.html(<Dashboard feedback={signals} />);
});

app.post("/feedback", async (c) => {
  const body = await c.req.json<{ source: FeedbackSource; text: string }>();
  const id = crypto.randomUUID();

  const entry: FeedbackEntry = {
    id,
    source: body.source,
    rawText: body.text,
  };

  // Trigger Workflow
  await c.env.ANALYZE_WORKFLOW.create({
    id: `feedback-${id}`,
    params: entry,
  });

  return c.json({ status: "queued", id });
});

export { AnalyzeWorkflow } from "./workflows/analyze";
export default app;
