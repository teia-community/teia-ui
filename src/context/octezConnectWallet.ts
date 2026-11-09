import {
  DAppClient,
  DAppClientOptions,
  getDAppClientInstance,
  PermissionScope,
  RequestPermissionInput,
  SigningType,
} from '@tezos-x/octez.connect-dapp'
import {
  createIncreasePaidStorageOperation,
  createOriginationOperation,
  createRegisterGlobalConstantOperation,
  createSetDelegateOperation,
  createTransferOperation,
  createTransferTicketOperation,
  WalletProvider,
} from '@taquito/taquito'
import { buf2hex, hex2buf, mergebuf } from '@taquito/utils'

// Taquito has no octez.connect wallet package (@taquito/beacon-wallet is tied
// to @ecadlabs/beacon-dapp), so this is a port of its BeaconWallet onto
// @tezos-x/octez.connect-dapp.

type Params = {
  fee?: number | string
  storageLimit?: number | string
  gasLimit?: number | string
}

export class OctezConnectWallet implements WalletProvider {
  public client: DAppClient

  constructor(options: DAppClientOptions) {
    this.client = getDAppClientInstance(options)
  }

  async requestPermissions(request?: RequestPermissionInput) {
    await this.client.requestPermissions(request)
  }

  private async getAccountOrFail() {
    const account = await this.client.getActiveAccount()
    if (!account) {
      throw new Error(
        'You need to initialize the wallet by calling requestPermissions first'
      )
    }
    return account
  }

  async getPKH() {
    return (await this.getAccountOrFail()).address
  }

  async getPK() {
    return (await this.getAccountOrFail()).publicKey ?? ''
  }

  /** Shows the "preparing" UI while Taquito estimates, then builds the RPC op. */
  private async map<P extends Params>(
    params: () => Promise<P>,
    create: (p: any) => Promise<any>
  ) {
    let walletParams: P
    await this.client.showPrepare()
    try {
      walletParams = await params()
    } catch (err) {
      await this.client.hideUI(['alert'])
      throw err
    }
    const operatedParams = await create(this.formatParameters(walletParams))
    // Leave fee/limits the user didn't set to the wallet instead of Taquito's defaults
    if (!walletParams.fee) delete operatedParams.fee
    if (!walletParams.storageLimit) delete operatedParams.storage_limit
    if (!walletParams.gasLimit) delete operatedParams.gas_limit
    return operatedParams
  }

  private formatParameters<P extends Params>(params: P) {
    if (params.fee) params.fee = params.fee.toString()
    if (params.storageLimit) params.storageLimit = params.storageLimit.toString()
    if (params.gasLimit) params.gasLimit = params.gasLimit.toString()
    return params
  }

  mapTransferParamsToWalletParams = (params: () => Promise<any>) =>
    this.map(params, createTransferOperation)
  mapTransferTicketParamsToWalletParams = (params: () => Promise<any>) =>
    this.map(params, createTransferTicketOperation)
  mapStakeParamsToWalletParams = (params: () => Promise<any>) =>
    this.map(params, createTransferOperation)
  mapUnstakeParamsToWalletParams = (params: () => Promise<any>) =>
    this.map(params, createTransferOperation)
  mapFinalizeUnstakeParamsToWalletParams = (params: () => Promise<any>) =>
    this.map(params, createTransferOperation)
  mapIncreasePaidStorageWalletParams = (params: () => Promise<any>) =>
    this.map(params, createIncreasePaidStorageOperation)
  mapOriginateParamsToWalletParams = (params: () => Promise<any>) =>
    this.map(params, createOriginationOperation)
  mapDelegateParamsToWalletParams = (params: () => Promise<any>) =>
    this.map(params, createSetDelegateOperation)
  mapRegisterGlobalConstantParamsToWalletParams = (
    params: () => Promise<any>
  ) => this.map(params, createRegisterGlobalConstantOperation)

  async sendOperations(params: any[]) {
    const account = await this.getAccountOrFail()
    if (!account.scopes.includes(PermissionScope.OPERATION_REQUEST)) {
      throw new Error(
        `Required permission scope were not granted for "${PermissionScope.OPERATION_REQUEST}"`
      )
    }
    const { transactionHash } = await this.client.requestOperation({
      operationDetails: params,
    })
    return transactionHash
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    let bb = hex2buf(bytes)
    if (watermark !== undefined) bb = mergebuf(watermark, bb)
    const signingType = this.getSigningType(watermark)
    if (signingType !== SigningType.OPERATION) {
      throw new Error(
        `octez.connect wallet currently only supports signing operations, not ${signingType}`
      )
    }
    const { signature } = await this.client.requestSignPayload({
      payload: buf2hex(bb),
      signingType,
    })
    return signature
  }

  private getSigningType(watermark?: Uint8Array) {
    if (!watermark || watermark.length === 0) return SigningType.RAW
    if (watermark.length === 1) {
      if (watermark[0] === 5) return SigningType.MICHELINE
      if (watermark[0] === 3) return SigningType.OPERATION
    }
    throw new Error(`Invalid watermark ${JSON.stringify(watermark)}`)
  }
}
