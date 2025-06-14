import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
  WalletNetwork
} from "@creit.tech/stellar-wallets-kit";

// const SELECTED_WALLET_ID = "selectedWalletId";

// function getSelectedWalletId() {
//   return localStorage.getItem(SELECTED_WALLET_ID);
// }

const kit = new StellarWalletsKit({
  modules: allowAllModules(),
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
});

export const signTransaction = kit.signTransaction.bind(kit);

export async function getPublicKey() {
  // if (!getSelectedWalletId()) return null;
  const { address } = await kit.getAddress();
  return address;
}

export async function setWallet(walletId: string) {
  // localStorage.setItem(SELECTED_WALLET_ID, walletId);
  kit.setWallet(walletId);
}

export async function disconnect(callback?: () => Promise<void>) {
  // localStorage.removeItem(SELECTED_WALLET_ID);
  kit.disconnect();
  if (callback) await callback();
}

export async function connect(callback?: () => Promise<void>) {
  await kit.openModal({
    onWalletSelected: async (option) => {
      try {
        await setWallet(option.id);
        if (callback) await callback();
      } catch (e) {
        console.error(e);
      }
      return option.id;
    },
  });
}