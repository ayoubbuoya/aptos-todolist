import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const moduleAddress =
  "0xf1807e33128a31d6f2751ccd6dc46ad30c114f32cfe8a7e97bfa20696f0749b0";

export const aptosConfig = new AptosConfig({
  network: Network.DEVNET,
});

export const aptos = new Aptos(aptosConfig);
