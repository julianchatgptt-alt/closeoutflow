import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton
} from "@closeoutflow/ui";
import { serverEnv } from "@closeoutflow/env/server";
import { notFound } from "next/navigation";

export default function ComponentPlayground() {
  if (!["local", "test"].includes(serverEnv.APP_ENV)) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-3xl font-semibold">Foundation component playground</h1>
      <Card>
        <CardHeader>
          <CardTitle>Minimal primitives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-2" htmlFor="playground-input">
            <span>Example field</span>
            <Input id="playground-input" placeholder="Accessible input" />
          </label>
          <div className="flex gap-3">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
          </div>
          <Skeleton className="h-5 w-48" />
        </CardContent>
      </Card>
    </main>
  );
}
