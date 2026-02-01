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

const Dashboard: FC<{ feedback: FeedbackEntry[] }> = ({ feedback }) => (
  <Layout>
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Urgent + Negative Feedback</h1>
        <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
          {feedback.length} Signals
        </div>
      </div>

      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feedback
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Urgency
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {feedback.map((f) => (
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {f.source}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">{f.rawText}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      f.urgency === "critical"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {f.urgency}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
);

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(feedbackEntries).all();
  // Filter for urgent/negative in the query or here for prototype
  const signals: FeedbackEntry[] = results
    .filter((r) => (r.urgency === "high" || r.urgency === "critical") && r.sentiment === "negative")
    .map((r) => ({
      ...r,
      source: r.source as FeedbackSource,
      sentiment: r.sentiment as FeedbackEntry["sentiment"],
      urgency: r.urgency as FeedbackEntry["urgency"],
      category: r.category ?? undefined,
      createdAt: r.createdAt ?? undefined,
    }));

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
