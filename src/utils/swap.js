import {
  MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE,
  SWAP_TYPE_HEN,
  SWAP_TYPE_TEIA,
  teiaSwapSchema,
} from '@constants'
import { MichelCodecPacker, OpKind } from '@taquito/taquito'
import teiaSwapLambda from '@components/collab/lambdas/teiaMarketplaceSwap.json'
import { Parser } from '@taquito/michel-codec'
import { Schema } from '@taquito/michelson-encoder'

export const Packer = new MichelCodecPacker()

export const packData = (rawData, schema) => {
  const parser = new Parser()
  const michelsonType = parser.parseData(schema)
  const parsedSchema = new Schema(michelsonType)
  const data = parsedSchema.Encode(rawData)

  return {
    data,
    type: michelsonType,
  }
}

export function createAddOperatorCall(
  objktsContract,
  objkt_id,
  ownerAddress,
  operatorAddress
) {
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
  objktsContract,
  objkt_id,
  ownerAddress,
  operatorAddress
) {
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
  marketplaceContract,
  objktsAddress,
  objkt_id,
  ownerAddress,
  objkt_amount,
  xtz_per_objkt,
  royalties,
  creator,
  type = MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
) {
  if (type === SWAP_TYPE_TEIA) {
    return {
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
  }

  if (type === SWAP_TYPE_HEN) {
    return {
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
    }
  }
}

export function createSwapCalls(
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
  collabContract,
  marketplaceAddress,
  objktsAddress,
  objkt_id,
  ownerAddress,
  objkt_amount,
  xtz_per_objkt,
  royalties,
  creator
) {
  const data = {
    marketplaceAddress,
    params: {
      fa2: objktsAddress,
      objkt_id: parseFloat(objkt_id),
      objkt_amount: parseFloat(objkt_amount),
      royalties: parseFloat(royalties),
      xtz_per_objkt: parseFloat(xtz_per_objkt),
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
