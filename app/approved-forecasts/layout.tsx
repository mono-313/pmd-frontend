import Header from "@/app/component/header";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";



import SessionGuard from
  "@/app/component/authorization/SessionGuard";

import type {
  ReactNode,
} from "react";


export default function SectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <SessionGuard>
    <div className="min-h-screen">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      <Footer />
    </div>
    </SessionGuard>
  );
}