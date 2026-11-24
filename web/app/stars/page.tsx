import type { Metadata } from "next";
import { Title } from "~/components/Chrome";
import StarHistoryView from "./StarHistoryView";

export const metadata: Metadata = {
  title: "GitHub Star History — ghrank",
  description: "Chart how the stars of any GitHub repository grew over time, and compare repositories side by side.",
  alternates: { canonical: "/stars/" },
};

export default function Stars() {
  return (
    <>
      <Title titleKey="stars.title" />
      <StarHistoryView />
    </>
  );
}
