import type { Metadata } from "next";
import { Footer, Header } from "~/components/Chrome";
import { LangProvider } from "~/components/LangProvider";
import { usersMeta } from "~/lib/data";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "ghrank — GitHub Developer and Repository Rankings",
  description:
    "Every GitHub developer with over 1,000 followers and every repository with over 2,000 stars, refreshed weekly with rank changes. No 1,000-result ceiling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = usersMeta();
  return (
    <html lang="en">
      <body>
        <LangProvider>
          <Header base={base} date={meta?.date ?? null} />
          <div className="wrap">
            {children}
            <Footer />
          </div>
        </LangProvider>
      </body>
    </html>
  );
}
