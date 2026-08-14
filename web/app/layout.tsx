import type { Metadata } from "next";
import { Footer, Header } from "~/components/Chrome";
import { LangProvider } from "~/components/LangProvider";
import { usersMeta } from "~/lib/data";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ghrank.com";

const title = "ghrank — GitHub Developer and Repository Rankings";
const description
  = "Every GitHub developer with over 1,000 followers and every repository with over 2,000 stars, refreshed weekly with rank changes. No 1,000-result ceiling.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: title, template: "%s" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ghrank",
    url: "/",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
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
