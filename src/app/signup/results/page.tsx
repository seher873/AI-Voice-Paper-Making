import { redirect } from "next/navigation";

export default function ResultsSignup() {
  redirect("/login?plan=results");
}
