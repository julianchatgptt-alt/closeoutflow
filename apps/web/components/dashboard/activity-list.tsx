import { Check, Eye, Send, Upload } from "lucide-react";
import Link from "next/link";

const activity = [
  { text: "Jordan Lee reviewed the HVAC O&M Manual", time: "1h ago", icon: Eye },
  { text: "Sam Rivera submitted a replacement document", time: "2h ago", icon: Upload },
  { text: "Morgan Chen requested the Roofing Warranty", time: "3h ago", icon: Send },
  { text: "Avery Patel approved the Fire Alarm Test Report", time: "4h ago", icon: Check }
] as const;

export function ActivityList() {
  return (
    <section className="rounded-lg bg-surface p-5 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-overline">Recent activity</h2>
        <Link
          href="/projects/riverside-medical-office/activity"
          className="text-[13px] font-medium text-primary hover:underline"
        >
          View all <span aria-hidden="true">›</span>
        </Link>
      </div>
      <ol className="divide-y">
        {activity.map(({ text, time, icon: Icon }, index) => (
          <li
            key={text}
            className={`flex min-h-10 items-center gap-3 py-1.5 ${index > 2 ? "hidden sm:flex" : ""}`}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted">
              <Icon aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px]">{text}</span>
            <time className="shrink-0 text-xs text-muted-foreground tabular-nums">{time}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
