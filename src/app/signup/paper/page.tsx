import { redirect } from "next/navigation";

export default function PaperSignup() {
  redirect("/login?plan=paper");
}
