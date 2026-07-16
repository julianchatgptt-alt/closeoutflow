import { serverEnv } from "@closeoutflow/env/server";
import { notFound, redirect } from "next/navigation";

import { isPlaygroundEnabled } from "./access";

export const dynamic = "force-dynamic";

export default function ComponentPlayground() {
  if (!isPlaygroundEnabled(serverEnv.APP_ENV)) notFound();
  redirect("/design");
}
