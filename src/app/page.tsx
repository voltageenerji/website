import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/sections/Hero";
import LiveMarket from "@/components/sections/LiveMarket";
import VoltageModel from "@/components/sections/VoltageModel";
import NationalNetwork from "@/components/sections/NationalNetwork";
import InvestmentScale from "@/components/sections/InvestmentScale";
import Future from "@/components/sections/Future";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative">
        <Hero />
        <LiveMarket />
        <VoltageModel />
        <NationalNetwork />
        <InvestmentScale />
        <Future />
      </main>
      <Footer />
    </>
  );
}
