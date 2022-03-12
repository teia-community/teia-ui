/* eslint-disable */
import React, { createContext, Component } from 'react'
import { withRouter } from 'react-router'
import {
  BeaconWallet,
  // BeaconWalletNotInitialized,
} from '@taquito/beacon-wallet'
import { TezosToolkit, OpKind, MichelCodecPacker } from '@taquito/taquito'
import { packParticipantMap } from '../components/collab/functions';
import { setItem } from '../utils/storage'
import { MARKETPLACE_CONTRACT_V1, MARKETPLACE_CONTRACT_V2, MAIN_MARKETPLACE_CONTRACT, MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE, SWAP_TYPE_TEIA, SWAP_TYPE_HEN, BURN_ADDRESS, getLogoList } from '../constants'
const { NetworkType } = require('@airgap/beacon-sdk')
var ls = require('local-storage')
const axios = require('axios')
const eztz = require('eztz-lib')

// import { Parser, Expr } from "@taquito/michel-codec";
// import { Schema } from "@taquito/michelson-encoder";
// import { KeyStoreUtils } from 'conseiljs-softsigner'
// import { PermissionScope } from '@airgap/beacon-sdk'
// import { UnitValue } from '@taquito/michelson-encoder'
// import { contentType } from 'mime-types';


export const HicetnuncContext = createContext()

// TODO: move this schema into separate place?
const createProxySchema = `
  (map address (pair (bool %isCore) (nat %share))))
`

//const bandwidth = navigator.connection.downlink
//const connectionType = navigator.connection
//console.log('band', bandwidth, 'type', connectionType)
// This should be moved to a service so it is only done once on page load
//const Tezos = new TezosToolkit('https://api.tez.ie/rpc/mainnet')
//const Tezos = new TezosToolkit('https://mainnet-tezos.giganode.io')
//const Tezos = new TezosToolkit('https://mainnet.smartpy.io')
//const Tezos = new TezosToolkit('eu01-node.teztools.net-lb')
const Tezos = new TezosToolkit('https://mainnet.api.tez.ie')
const Packer = new MichelCodecPacker();
//const Tezos = new TezosToolkit('https://api.tez.ie/rpc/mainnet')
// storage fee adjustment

/* export class PatchedBeaconWallet extends BeaconWallet {
  async sendOperations(params) {
    const account = await this.client.getActiveAccount();
    if (!account) {
      throw new BeaconWalletNotInitialized();
    }
    const permissions = account.scopes;
    this.validateRequiredScopesOrFail(permissions, [PermissionScope.OPERATION_REQUEST]);

    const { transactionHash } = await this.client.requestOperation({
      operationDetails: params.map(op => ({
        ...modifyFeeAndLimit(op),
      })),
    });
    return transactionHash;
  }
}

function modifyFeeAndLimit(op) {
  const { fee, gas_limit, storage_limit, ...rest } = op;

  if (op.parameters && (op.parameters.entrypoint === "swap") || (op.parameters.entrypoint === "mint_OBJKT") || (op.parameters.entrypoint === "collect")) {
    rest.storage_limit = 310
  }
  return rest;
}


const wallet = new PatchedBeaconWallet({
  name: 'hicetnunc.xyz',
  preferredNetwork: 'mainnet',
}) */

const wallet = new BeaconWallet({
  name: 'teia.art',
  preferredNetwork: 'mainnet',
})

Tezos.setWalletProvider(wallet)

function createSwapCalls(
  objktsContract,
  marketplaceContract,
  objktsAddress,
  marketplaceAddress,
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
      ...objktsContract.methods.update_operators([{ add_operator: { operator: marketplaceAddress, token_id: parseFloat(objkt_id), owner: ownerAddress } }])
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 })
    },
    type === SWAP_TYPE_TEIA ? (
      // it's the teia marketplace contract
      {
        kind: OpKind.TRANSACTION,
        ...marketplaceContract.methods.swap(objktsAddress, parseFloat(objkt_id), parseFloat(objkt_amount), parseFloat(xtz_per_objkt), parseFloat(royalties), creator).toTransferParams({ amount: 0, mutez: true, storageLimit: 300 })
      }
      ) : (
      // it's the hen v2 markeptlace contract
      {
        kind: OpKind.TRANSACTION,
        ...marketplaceContract.methods.swap(creator, parseFloat(objkt_amount), parseFloat(objkt_id), parseFloat(royalties), parseFloat(xtz_per_objkt)).toTransferParams({ amount: 0, mutez: true, storageLimit: 300 })
      }
    ),
    {
      kind: OpKind.TRANSACTION,
      ...objktsContract.methods.update_operators([{ remove_operator: { operator: marketplaceAddress, token_id: parseFloat(objkt_id), owner: ownerAddress } }])
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 })
    },
  ];
}


class HicetnuncContextProviderClass extends Component {

  constructor(props) {
    super(props)

    this.state = {
      // smart contracts

      // TODO: move these into constants.js?
      hDAO: 'KT1AFA2mwNUMNd4SsujE1YYp29vd8BZejyKW',
      subjkt: 'KT1My1wDZHDGweCrJnQJi3wcFaS67iksirvj',
      v1: MARKETPLACE_CONTRACT_V1,
      unregistry: 'KT18xby6bb1ur1dKe7i6YVrBaksP4AgtuLES',
      v2: MARKETPLACE_CONTRACT_V2,
      objkts: 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton',
      hDAO_curation: 'KT1TybhR7XraG75JFYKSrh7KnxukMBT5dor6',
      hDAO_marketplace: 'KT1QPvv7sWVaT9PcPiC4fN9BgfX8NB2d5WzL',

      // Collab additions
      proxyFactoryAddress: 'KT1DoyD6kr8yLK8mRBFusyKYJUk2ZxNHKP1N',
      signingContractAddress: 'KT1BcLnWRziLDNJNRn3phAANKrEBiXhytsMY',

      lastId: undefined,
      setId: (id) => this.setState({ lastId: id }),

      subjktInfo: {},
      setSubjktInfo: (subjkt) => this.setState({ subjktInfo: subjkt }),

      swap: async (from, royalties, xtz_per_objkt, objkt_id, creator, objkt_amount) => {
        // If using proxy: both calls are made through this.state.proxyAddress:
        const objktsAddress = this.state.proxyAddress || this.state.objkts;
        const marketplaceAddress = this.state.proxyAddress || MAIN_MARKETPLACE_CONTRACT;
        const ownerAddress = this.state.proxyAddress || from;

        const [
          objktsContract,
          marketplaceContract
        ] = await Promise.all([Tezos.wallet.at(objktsAddress), Tezos.wallet.at(marketplaceAddress)]);

        const list = createSwapCalls(
          objktsContract,
          marketplaceContract,
          objktsAddress,
          marketplaceAddress,
          objkt_id,
          ownerAddress,
          objkt_amount,
          xtz_per_objkt,
          royalties,
          creator,
          // use v2 in case of a collab contract (until support is added)
          this.state.proxyAddress ? SWAP_TYPE_HEN : MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
        );

        let batch = await Tezos.wallet.batch(list);

        return await batch.send()
      },

      reswap: async (price, swap) => {
        // TODO: this function currently does not take collab contracts to account
        let objkt_id = swap.token.id
        let creator = swap.token.creator_id
        let from = swap.creator_id

        if (this.state.proxyAddress) {
          this.state.setFeedback({
            message: 'reswapping is not yet supported in collab mode',
            progress: false,
            confirm: false,
            visible: true,
            confirm: true,
            confirmCallback: () => {
              this.state.setFeedback({
                visible: false,
              })
            }
          })
          return;
        }

        const [objktsContract, marketplaceContract, mainMarketplaceContract] = await Promise.all([
          Tezos.wallet.at(this.state.objkts),
          Tezos.wallet.at(swap.contract_address), // this can be either v1, v2 or teia
          Tezos.wallet.at(MAIN_MARKETPLACE_CONTRACT)
        ])

        let list = [
          // cancel current swap
          {
            kind: OpKind.TRANSACTION,
            ...marketplaceContract.methods.cancel_swap(parseFloat(swap.id)).toTransferParams({ amount: 0, mutez: true, storageLimit: 310 })
          },
          // swap with new price
          ...createSwapCalls(
            objktsContract,
            mainMarketplaceContract,
            this.state.objkts,
            MAIN_MARKETPLACE_CONTRACT,
            objkt_id,
            from,
            swap.amount_left,
            price,
            swap.royalties,
            creator,
            MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
          )
        ];

        console.log(list)
        let batch = await Tezos.wallet.batch(list);
        return await batch.send()
      },

      batch_cancelv1: async (arr) => {
        let v1 = await Tezos.wallet.at(MARKETPLACE_CONTRACT_V1)

        /*         const batch = await arr
                  .map((e) => parseInt(e.id))
                  .reduce((batch, id) => {
                    return { kind : OpKind.TRANSACTION, ...batch.withContractCall(v1.methods.cancel_swap(id)).toTransferParams({ amount: 0, mutez: true, storageLimit: 150 }) }
                  }, Tezos.wallet.batch()) */
        const batch = await arr
          .map((e) => parseInt(e.id))
          .reduce((batch, id) => {
            return batch.withContractCall(v1.methods.cancel_swap(id))
          }, Tezos.wallet.batch())
        return await batch.send()
      },

      // fullscreen. DO NOT CHANGE!
      fullscreen: false,
      setFullscreen: (fullscreen) => this.setState({ fullscreen }),

      logo: '',
      setLogo: () => {
        const logo_list = getLogoList()
        this.setState({ logo: logo_list[Math.floor(Math.random() * logo_list.length)] })
      },
      // theme, DO NO CHANGE!
      theme: 'light',
      setTheme: (theme) => {
        let root = document.documentElement

        const light = theme === 'light'

        setItem('theme', light ? 'light' : 'dark')

        root.style.setProperty(
          '--background-color',
          light ? '#ffffff' : '#111111'
        )
        root.style.setProperty(
          '--background-color-rgb',
          light ? '255, 255, 255' : '0, 0, 0'
        )
        root.style.setProperty('--text-color', light ? '#000000' : '#dedede')
        root.style.setProperty(
          '--border-color',
          light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)'
        )
        root.style.setProperty(
          '--shadow-color',
          light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'
        )
        root.style.setProperty(
          '--secondary-color',
          light ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'
        )

        root.style.setProperty(
          '--gray-0',
          light ? '#FFFFFF' : '#000000'
        )

        root.style.setProperty(
          '--gray-05',
          light ? '#F2F2F2' : '#0D0D0D'
        )

        root.style.setProperty(
          '--gray-10',
          light ? '#E6E6E6' : '#1A1A1A'
        )

        root.style.setProperty(
          '--gray-15',
          light ? '#D9D9D9' : '#262626'
        )

        root.style.setProperty(
          '--gray-20',
          light ? '#CCCCCC' : '#333333'
        )

        root.style.setProperty(
          '--gray-30',
          light ? '#B3B3B3' : '#4D4D4D'
        )

        root.style.setProperty(
          '--gray-40',
          light ? '#999999' : '#666666'
        )

        root.style.setProperty(
          '--gray-50',
          light ? '#808080' : '#808080'
        )

        root.style.setProperty(
          '--gray-60',
          light ? '#666666' : '#999999'
        )

        root.style.setProperty(
          '--gray-70',
          light ? '#4D4D4D' : '#B3B3B3'
        )

        root.style.setProperty(
          '--gray-80',
          light ? '#333333' : '#CCCCCC'
        )

        root.style.setProperty(
          '--gray-90',
          light ? '#191919' : '#E6E6E6'
        )

        root.style.setProperty(
          '--gray-100',
          light ? '#000000' : '#FFFFFF'
        )

        this.setState({ theme })
      },

      // --------------------
      // feedback component
      // --------------------
      feedback: {
        visible: false, // show or hide the component
        message: 'OBJKT minted', // what message to display?
        progress: true, // do we need to display a progress indicator?
        confirm: true, // do we display a confirm button?
        confirmCallback: () => null, // any function to run when the user clicks confirm
      },

      setFeedback: (props) =>
        this.setState({ feedback: { ...this.state.feedback, ...props } }),

      progress: undefined,
      setProgress: (bool) => this.setState({ progress: bool }),
      message: undefined,
      setMessage: (str) => this.setState({ message: str }),
      // --------------------
      // feedback component end
      // --------------------
      pathname: '',

      address: '',

      op: undefined,

      contract: '',

      setAddress: (address) => this.setState({ address: address }),

      setAuth: (address) => {
        ls.set('auth', address)
      },

      updateLs: (key, value) => {
        ls.set(key, value)
      },

      getLs: (key) => {
        return ls.get(key)
      },

      getAuth: () => {
        return ls.get('auth')
      },

      client: null,

      // Signed in collab address (if applicable)
      // We will retrieve from local storage
      proxyAddress: ls.get('collab_address'),
      proxyName: ls.get('collab_name'),

      // This will be set after creating a new collab
      // but we don't want to auto-sign in
      originatedContract: undefined,
      originationOpHash: undefined,

      setClient: (client) => {
        this.setState({
          client: client,
        })
      },

      dAppClient: async () => {
        this.state.client = wallet.client

        // It doesn't look like this code is called, otherwise the active account should be checked, see below.
        this.state.client
          .requestPermissions({
            network: {
              type: NetworkType.MAINNET,
              rpcUrl: 'https://mainnet.smartpy.io',
            },
          })
          .then((permissions) => {
            this.setState({
              address: permissions.address,
            })

            this.state.setAuth(permissions.address)
          })
          .catch((error) => console.log(error))
      },

      // This will be set after creating a new collab
      // but we don't want to auto-sign in
      originatedContract: null,

      setProxyAddress: (proxyAddress, proxyName) => {
        // setting proxy updates objkt contract as well:
        this.setState({
          proxyAddress,
          proxyName,
        });

        // Store in local storage too for retrieval later
        ls.set('collab_address', proxyAddress)
        ls.set('collab_name', proxyName)
      },

      // Do we need this? proxyAddress will push to UI via context
      getProxy: () => this.state.proxyAddress,

      objkt: MARKETPLACE_CONTRACT_V1,

      mint: async (tz, amount, cid, royalties) => {
        // show feedback component with followind message and progress indicator

        console.log(cid)

        this.state.setFeedback({
          visible: true,
          message: 'preparing OBJKT',
          progress: true,
          confirm: false,
        })

        // call mint method
        await Tezos.wallet
          .at(this.state.proxyAddress || this.state.v1)
          .then((c) =>
            c.methods
              .mint_OBJKT(
                tz,
                parseFloat(amount),
                ('ipfs://' + cid)
                  .split('')
                  .reduce(
                    (hex, c) =>
                      (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                    ''
                  ),
                parseFloat(royalties) * 10
              )
              .send({ amount: 0, storageLimit: 310 })
          )
          .then((op) =>
            op.confirmation(1).then(() => {
              this.setState({ op: op.hash }) // save hash
              // if everything goes okay, show the success message and redirect to profile
              this.state.setFeedback({
                message: 'OBJKT minted successfully',
                progress: true,
                confirm: false,
              })

              // hide after 1 second
              setTimeout(() => {
                this.state.setFeedback({
                  visible: false,
                })
              }, 1000)
            })
          )
          .catch((err) => {
            // if any error happens
            this.state.setFeedback({
              message: 'an error occurred ❌',
              progress: true,
              confirm: false,
            })

            // hide after 1 second
            setTimeout(() => {
              this.state.setFeedback({
                visible: false,
              })
            }, 1000)
          })
      },

      collect: async (contract_address, swap_id, amount) => {
        return await Tezos.wallet
          .at(this.state.proxyAddress || contract_address)
          .then((c) =>
            c.methods
              .collect(parseFloat(swap_id))
              .send({
                amount: parseFloat(amount),
                mutez: true,
                storageLimit: 350,
              })
          )
          .catch((e) => e)
      },

      curate: async (objkt_id) => {
        await Tezos.wallet
          .at(this.state.v1)
          .then((c) =>
            c.methods
              .curate(
                ls.get('hDAO_config') != null
                  ? parseInt(ls.get('hDAO_config'))
                  : 1,
                objkt_id
              )
              .send()
          )
      },

      sign: async (objkt_id) => {
        await Tezos.wallet
          .at(this.state.signingContractAddress)
          .then(c => c.methods
            .sign(objkt_id)
            .send({ amount: 0, storageLimit: 310 })
          )
          .then((op) => console.log(op))
      },

      claim_hDAO: async (hDAO_amount, objkt_id) => {
        await Tezos.wallet
          .at(this.state.hDAO_curation)
          .then((c) => {
            c.methods
              .claim_hDAO(parseInt(hDAO_amount), parseInt(objkt_id))
              .send()
          })
      },

      batch_claim: async (arr) => {
        console.log(arr)
        let curation = await Tezos.wallet.at(this.state.hDAO_curation)
        let transactions = arr.map(e => {
          return {
            kind: OpKind.TRANSACTION,
            ...curation.methods.claim_hDAO(e.hdao_balance, e.id)
              .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 })
          }
        })
        let batch = await Tezos.wallet.batch(transactions)
        return await batch.send()
      },

      transfer: async (txs) => {
        const { proxyAddress } = this.state;

        await Tezos.wallet
          .at(proxyAddress)
          .then(async (c) => c.methods.transfer([
                {
                  from_: proxyAddress,
                  txs,
                },
              ])
              .send()
          )
      },

      burn: async (objkt_id, amount) => {
        var tz = await wallet.client.getActiveAccount()
        const objktsOrProxy = this.state.proxyAddress || this.state.objkts;
        const addressFrom = this.state.proxyAddress || tz.address;

        console.log("Using", objktsOrProxy, "for burn");

        await Tezos.wallet
          .at(objktsOrProxy)
          .then(async (c) =>
            c.methods
              .transfer([
                {
                  from_: addressFrom,
                  txs: [
                    {
                      to_: BURN_ADDRESS,
                      token_id: parseInt(objkt_id),
                      amount: parseInt(amount),
                    },
                  ],
                },
              ])
              .send()
          )

        this.state.setProgress(false)
      },

      cancelv1: async (swap_id) => {
        return await Tezos.wallet
          .at(MARKETPLACE_CONTRACT_V1)
          .then((c) =>
            c.methods
              .cancel_swap(parseFloat(swap_id))
              .send({ amount: 0, storageLimit: 310 })
          )
          .catch((e) => e)
      },

      cancel: async (contract_address, swap_id) => {
        return await Tezos.wallet
          .at(this.state.proxyAddress || contract_address)
          .then((c) =>
            c.methods
              .cancel_swap(parseFloat(swap_id))
              .send({ amount: 0, storageLimit: 310 })
          )
          .catch((e) => e)
      },

      signStr: async (payload) => {
        const signedPayload = await wallet.client.requestSignPayload(payload)
        // console.log(signedPayload, payload)
        const signature = signedPayload
        // console.log(signature.signature, payload.payload, await wallet.getPKH())
        /*         const r = await KeyStoreUtils.checkSignature(
          signature.signature,
          payload.payload,
          await axios.get(`https://tezos-prod.cryptonomic-infra.tech/chains/main/blocks/head/context/contracts/${await wallet.getPKH()}/manager_key`).then(res => res.data)
        ) */

        const r = await eztz.crypto.verify(
          payload.payload.toString(),
          signature.signature,
          await axios.get(
            `https://tezos-prod.cryptonomic-infra.tech/chains/main/blocks/head/context/contracts/${await wallet.getPKH()}/manager_key`
          )
        )
        // console.log(r)
      },

      registry: async (alias, metadata) => {
        // console.log(metadata)
        const subjktAddressOrProxy = this.state.proxyAddress || this.state.subjkt

        return await Tezos.wallet.at(subjktAddressOrProxy).then((c) =>
          c.methods
            .registry(
              ('ipfs://' + metadata.path)
                .split('')
                .reduce(
                  (hex, c) =>
                    (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                  ''
                ),
              alias
                .split('')
                .reduce(
                  (hex, c) =>
                    (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                  ''
                )
            )
            .send({ amount: 0 })
        )
      },

      hDAO_update_operators: async (address) => {
        return await Tezos.wallet.at(this.state.hDAO).then((c) =>
          c.methods
            .update_operators([
              {
                add_operator: {
                  owner: address,
                  operator: this.state.subjkt,
                  token_id: 0,
                },
              },
            ])
            .send({ amount: 0 })
        )
      },

      unregister: async () => {
        return await Tezos.wallet.at(this.state.unregistry).then((c) => {
          c.methods.sign(undefined).send({ amount: 0 })
        })
      },

      load: false,
      loading: () => this.setState({ load: !this.state.load }),
      /* taquito */
      Tezos: null,
      wallet: null,
      acc: null,

      updateMessage: (message) => this.setState({ message: message }),

      setAccount: async () => {
        this.setState({
          acc:
            Tezos !== undefined
              ? await wallet.client.getActiveAccount()
              : undefined,
          address: await wallet.client.getActiveAccount(),
        })
      },

      syncTaquito: async () => {
        const network = {
          type: 'mainnet',
          rpcUrl: 'https://mainnet.smartpy.io',
        }

        // We check the storage and only do a permission request if we don't have an active account yet
        // This piece of code should be called on startup to "load" the current address from the user
        // If the activeAccount is present, no "permission request" is required again, unless the user "disconnects" first.
        const activeAccount = await wallet.client.getActiveAccount()
        // console.log(activeAccount)
        if (activeAccount === undefined) {
          console.log('permissions')
          await wallet.requestPermissions({ network })
        }

        this.setState({
          Tezos: Tezos,
          address: await wallet.getPKH(),
          acc: await wallet.client.getActiveAccount(),
          wallet,
        })
        this.state.setAuth(await wallet.getPKH())
        // console.log(this.state)
      },

      disconnect: async () => {
        // console.log('disconnect wallet')
        // This will clear the active account and the next "syncTaquito" will trigger a new sync
        await wallet.client.clearActiveAccount()
        this.setState({
          address: undefined,
          acc: undefined,
        })
      },

      /*
            airgap/thanos interop methods
      */
      operationRequest: async (obj) => {
        var op = obj.result
        delete op.mutez
        op.destination = op.to
        op.kind = 'transaction'
        delete op.to
        // console.log(obj.result)

        this.state.client.requestOperation({
          operationDetails: [obj.result],
        })
      },

      timeout: (delay) => {
        return new Promise((res) => setTimeout(res, delay))
      },

      signPayload: async (obj) => {
        await wallet.client
          .requestSignPayload({
            payload: obj.payload,
          })
          .then(async (response) => {
            return response.signature
          })
          .catch((signPayloadError) => console.error(signPayloadError))
      },

      balance: 0,

      getBalance: (address) => {
        axios
          .get(`https://api.tzkt.io/v1/accounts/${address}/balance_history`, {
            params: {
              address: address,
            },
          })
          .then((res) => {
            console.log(
              'balance',
              parseFloat(res.data[res.data.length - 1].balance / 1000000)
            )
          })
          .catch((e) => console.error('balance error', e))
      },

      collapsed: true,

      feed: [],

      offset: 0,

      setFeed: (arr) => this.setState({ feed: arr }),

      toogleNavbar: () => {
        this.setState({ collapsed: !this.state.collapsed })
      },

      setMenu: (collapsed) => {
        this.setState({ collapsed })
      },

      getStyle: (style) =>
        style ? { background: 'white' } : { display: 'none' },

      lastPath: '',

      setPath: (path) => {
        this.setState({
          lastPath: path,
        })
      },
      title: '',
      setTitle: (title) => {
        this.setState({
          title: title,
        })
      },

      hDAO_vote: ls.get('hDAO_vote'),

      mockProxy: async () => {

        this.state.setFeedback({
          visible: true,
          message: 'creating collaborative contract',
          progress: true,
          confirm: false,
        })

        setTimeout(() => {
          const result = {
            opHash: 'oo28JbSrWr7NMy95qdba56m85TcA2poJCgteB5DWUEMrZvC1B38', // current one
          }

          this.setState({
            originationOpHash: result.opHash
          })

          this.state.setFeedback({
            visible: false,
          })
        }, 2000)
      },

      findOriginatedContractFromOpHash: async (hash) => {

        this.state.setFeedback({
          visible: true,
          message: 'Checking network for collab contract',
          progress: true,
          confirm: false,
        })

        axios
          .get(`https://api.tzkt.io/v1/operations/originations/${hash}`)
          .then(response => {

            const { data } = response;

            console.log("response from originations call", data[0]);

            if (data[0]) {
              console.log('There is correct data', data[0])

              // Send the originated contract to the UI via context
              const { originatedContract } = data[0]

              this.setState({
                originatedContract,
                originationOpHash: undefined,
              }) // save hash

              console.log("Saved state originatedContract", originatedContract);

              // We have got our contract address
              this.state.setFeedback({
                visible: true,
                message: 'Collaborative contract created successfully',
                progress: true,
                confirm: false,
              })

              setTimeout(() => {
                this.state.setFeedback({
                  visible: false,
                })
              }, 2000)

            } else {
              console.log('missing data')

              // We have got our contract address
              this.state.setFeedback({
                message: 'Sorry, there was possibly an error creating the collaborative contract - please check tzkt.io for your wallet address',
                progress: true,
                confirm: true,
              })
            }

            // Hide after 2 seconds
            setTimeout(() => {
              this.state.setFeedback({
                visible: false,
              })
            }, 2000)
          })
      },

      originateProxy: async participantData => {

        console.log("originateProxy", participantData)

        // Clear any existing calls
        this.setState({
          originationOpHash: undefined,
          originatedProxy: undefined,
        })

        // Show progress during creation
        this.state.setFeedback({
          visible: true,
          message: 'creating collaborative contract',
          progress: true,
          confirm: false,
        })

        const packDataParams = packParticipantMap(participantData);
        console.log("packDataParams", packDataParams);

        // Pack hex data for origination call
        const { packed } = await Packer.packData(packDataParams);

        // Blockchain ops
        await Tezos.wallet
          .at(this.state.proxyFactoryAddress)
          .then(c =>
            c.methods
              .create_proxy(packed, 'hic_proxy')
              .send({ amount: 0 })
          )
          .then(result => {

            console.log("Result of originate call", result)

            // Set the operation hash to trigger the countdown that checks for the originated contract
            this.setState({
              originationOpHash: result.opHash
            })
          })
          .catch(e => {
            this.state.setFeedback({
              message: e.message || 'an error occurred',
              progress: false,
              confirm: true,
              confirmCallback: () => {
                this.state.setFeedback({
                  visible: false,
                })
              }
            })
          })
      },
    }
  }

  render() {
    return (
      <HicetnuncContext.Provider
        value={{
          ...this.state,
        }}
      >
        {this.props.children}
      </HicetnuncContext.Provider>
    )
  }
}

const HicetnuncContextProvider = withRouter(HicetnuncContextProviderClass)
export default HicetnuncContextProvider
