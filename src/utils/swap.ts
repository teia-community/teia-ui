import {
  MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE,
  SWAP_TYPE_HEN,
  SWAP_TYPE_TEIA,
  teiaSwapSchema,
} from '@constants'
import {
  ContractAbstraction,
  MichelCodecPacker,
  OpKind,
  Wallet,
  WalletParamsWithKind,
} from '@taquito/taquito'
import teiaSwapLambda from '@components/collab/lambdas/teiaMarketplaceSwap.json'
import { Parser } from '@taquito/michel-codec'
import {
  MichelsonMap,
  MichelsonMapKey,
  Schema,
} from '@taquito/michelson-encoder'

export const Packer = new MichelCodecPacker()

export const packData = (
  rawData: MichelsonMap<MichelsonMapKey, unknown>,
  schema: string
) => {
  const parser = new Parser()
  const michelsonType = parser.parseData(schema)
  if (michelsonType) {
    const parsedSchema = new Schema(michelsonType)
    const data = parsedSchema.Encode(rawData)

    return {
      data,
      type: michelsonType,
    }
  }
  throw Error('Cannot pack data', { cause: 'invalid schema' })
}

export function createAddOperatorCall(
  objktsContract: ContractAbstraction<Wallet>,
  objkt_id: string,
  ownerAddress: string,
  operatorAddress: string
): WalletParamsWithKind {
  return {
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
  }
}

export function createRemoveOperatorCall(
  objktsContract: ContractAbstraction<Wallet>,
  objkt_id: string,
  ownerAddress: string,
  operatorAddress: string
): WalletParamsWithKind {
  return {
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
  }
}

export function createSwapCall(
  marketplaceContract: ContractAbstraction<Wallet>,
  objktsAddress: string,
  objkt_id: string,
  ownerAddress: string,
  objkt_amount: number,
  xtz_per_objkt: number,
  royalties: number,
  creator: string,
  type = MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
): WalletParamsWithKind {
  if (type === SWAP_TYPE_TEIA) {
    return {
      kind: OpKind.TRANSACTION,
      ...marketplaceContract.methods
        .swap(
          objktsAddress,
          parseFloat(objkt_id),
          objkt_amount,
          xtz_per_objkt,
          royalties,
          creator
        )
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
    }
  }

  if (type === SWAP_TYPE_HEN) {
    return {
      kind: OpKind.TRANSACTION,
      ...marketplaceContract.methods
        .swap(creator, objkt_amount, objkt_id, royalties, xtz_per_objkt)
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
    }
  }
  throw Error('Invalid Swap Type', {
    cause: 'Requested swap is neither a Teia or HEN swap',
  })
}

export function createSwapCalls(
  objktsContract: ContractAbstraction<Wallet>,
  marketplaceContract: ContractAbstraction<Wallet>,
  objktsAddress: string,
  operatorAddress: string,
  objkt_id: string,
  ownerAddress: string,
  objkt_amount: number,
  xtz_per_objkt: number,
  royalties: number,
  creator: string,
  type = MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
): WalletParamsWithKind[] {
  return [
    createAddOperatorCall(
      objktsContract,
      objkt_id,
      ownerAddress,
      operatorAddress
    ),
    createSwapCall(
      marketplaceContract,
      objktsAddress,
      objkt_id,
      ownerAddress,
      objkt_amount,
      xtz_per_objkt,
      royalties,
      creator,
      type
    ),
    createRemoveOperatorCall(
      objktsContract,
      objkt_id,
      ownerAddress,
      operatorAddress
    ),
  ]
}

export async function createLambdaSwapCall(
  collabContract: ContractAbstraction<Wallet>,
  marketplaceAddress: string,
  objktsAddress: string,
  objkt_id: string,
  ownerAddress: string,
  objkt_amount: number,
  xtz_per_objkt: number,
  royalties: number,
  creator: string
): Promise<WalletParamsWithKind> {
  const data: any = {
    marketplaceAddress,
    params: {
      fa2: objktsAddress,
      objkt_id: parseFloat(objkt_id),
      objkt_amount: objkt_amount,
      royalties: royalties,
      xtz_per_objkt: xtz_per_objkt,
      creator,
    },
  }

  const preparedSwap = packData(data, teiaSwapSchema)
  const { packed } = await Packer.packData(preparedSwap)

  return {
    kind: OpKind.TRANSACTION,
    ...collabContract.methods
      .execute(teiaSwapLambda, packed)
      .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
  }
}
