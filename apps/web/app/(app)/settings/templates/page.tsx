import { redirect } from "next/navigation";

export const metadata = { title: "Requirement Templates" };

// Templates are a first-class library surface; the historical settings route redirects.
export default function Page() {
  redirect("/templates");
}
