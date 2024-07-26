import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

const wallets = [new PetraWallet()];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
      <Component {...pageProps} />
    </AptosWalletAdapterProvider>
  );
}
