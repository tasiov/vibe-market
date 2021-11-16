import { FC, createContext, useContext } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export const ClusterContext = createContext<WalletAdapterNetwork>(
  WalletAdapterNetwork.Mainnet,
);

export const useCluster = () => useContext(ClusterContext);

export const ClusterContextProvider: FC = ({ children }) => {
  const envRpcNetwork = process.env.NEXT_PUBLIC_RPC_NETWORK || '';
  const network =
    envRpcNetwork === 'devnet'
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;
  return (
    <ClusterContext.Provider value={network}>
      {children}
    </ClusterContext.Provider>
  );
};
