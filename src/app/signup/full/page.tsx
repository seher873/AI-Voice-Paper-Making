import { redirect } from "next/navigation";

export default function FullSignup() {
  redirect("/login?plan=full");
}
