import { useWallet } from '@tezos-contrib/react-wallet-provider'
import { TezosToolkit } from '@taquito/taquito'
import { BeaconWallet } from '@taquito/beacon-wallet'
import {
  HEN_CONTRACT_FA2,
  MARKETPLACE_CONTRACT_V1,
  MARKETPLACE_CONTRACT_V2,
  MARKETPLACE_CONTRACT_OBJKTCOM_V1,
  MARKETPLACE_CONTRACT_OBJKTCOM_V4,
  MAIN_MARKETPLACE_CONTRACT,
  MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE,
  SWAP_TYPE_TEIA,
  SWAP_TYPE_HEN,
  BURN_ADDRESS,
  getLogoList,
} from '@constants'

const Tezos = new TezosToolkit('https://mainnet.api.tez.ie')

const wallet = new BeaconWallet({
  name: 'teia',
  preferredNetwork: 'mainnet',
})

Tezos.setWalletProvider(wallet)

function getWallet(client) {
  wallet.client = client
  return Tezos.wallet
}

function createSwapCalls(
  objktsContract,
  marketplaceContract,
  objktsAddress,
  operatorAddress,
  objkt_id,
  ownerAddress,
  objkt_amount,
  xtz_per_objkt,
  royalties,
  creator,
  type = MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
) {
  return [
    {
      kind: OpKind.TRANSACTION,
      ...objktsContract.methods
        .update_operators([
          {
            add_operator: {
              operator: operatorAddress,
              token_id: parseFloat(objkt_id),
              owner: ownerAddress,
            },
          },
        ])
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 }),
    },
    type === SWAP_TYPE_TEIA
      ? // it's the teia marketplace contract
        {
          kind: OpKind.TRANSACTION,
          ...marketplaceContract.methods
            .swap(
              objktsAddress,
              parseFloat(objkt_id),
              parseFloat(objkt_amount),
              parseFloat(xtz_per_objkt),
              parseFloat(royalties),
              creator
            )
            .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
        }
      : // it's the hen v2 markeptlace contract
        {
          kind: OpKind.TRANSACTION,
          ...marketplaceContract.methods
            .swap(
              creator,
              parseFloat(objkt_amount),
              parseFloat(objkt_id),
              parseFloat(royalties),
              parseFloat(xtz_per_objkt)
            )
            .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
        },
    {
      kind: OpKind.TRANSACTION,
      ...objktsContract.methods
        .update_operators([
          {
            remove_operator: {
              operator: operatorAddress,
              token_id: parseFloat(objkt_id),
              owner: ownerAddress,
            },
          },
        ])
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 }),
    },
  ]
}

export default function useWalletUtils() {}
