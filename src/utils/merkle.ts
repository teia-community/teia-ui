/**
 * Merkle tree utilities for channel allowlist proofs.
 *
 * Contract's verification logic:
 *   leaf = blake2b(pack(address))
 *   for step in proof:
 *     if direction == 0: computed = blake2b(step.hash + computed)  // sibling LEFT
 *     if direction == 1: computed = blake2b(computed + step.hash)  // sibling RIGHT
 *   assert computed == root
 *
 * Tree construction: pairs nodes left-to-right, duplicates the last node if odd count.
 */
import { blake2b } from 'blakejs'
import { packDataBytes } from '@taquito/michel-codec'
import { CIDToURL } from '@utils/index'

// ---------------------------------------------------------------------------
// Hex helpers
// ---------------------------------------------------------------------------

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// Leaf hashing
// ---------------------------------------------------------------------------

/**
 * Hash an address into a Merkle leaf.
 * Contract: blake2b(pack(address))
 */
export function addressToLeaf(address: string): Uint8Array {
  const packed = packDataBytes({ string: address }, { prim: 'address' })
  return blake2b(hexToBytes(packed.bytes), undefined, 32)
}

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------

/**
 * Build a Merkle tree from an ordered list of leaf hashes.
 * Returns an array of levels: tree[0] = leaves, tree[last] = [root].
 * Odd-count levels duplicate the last node before pairing.
 */
export function buildMerkleTree(leaves: Uint8Array[]): Uint8Array[][] {
  if (leaves.length === 0) return [[]]

  let currentLevel = [...leaves]
  const tree: Uint8Array[][] = [currentLevel.slice()]

  while (currentLevel.length > 1) {
    const nextLevel: Uint8Array[] = []
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left
      const combined = new Uint8Array(left.length + right.length)
      combined.set(left)
      combined.set(right, left.length)
      nextLevel.push(blake2b(combined, undefined, 32))
    }
    currentLevel = nextLevel
    tree.push(currentLevel.slice())
  }

  return tree
}

/** Get the Merkle root from a built tree. */
export function getMerkleRoot(tree: Uint8Array[][]): Uint8Array {
  return tree[tree.length - 1][0]
}

// ---------------------------------------------------------------------------
// Proof computation
// ---------------------------------------------------------------------------

/**
 * Compute a Merkle proof for a leaf at the given index.
 *
 * Each proof step: { hash, direction }
 *   direction 0 = sibling is on the LEFT  -> contract does blake2b(sibling + computed)
 *   direction 1 = sibling is on the RIGHT -> contract does blake2b(computed + sibling)
 */
export function getMerkleProof(
  tree: Uint8Array[][],
  leafIndex: number
): { hash: string; direction: number }[] {
  const proof: { hash: string; direction: number }[] = []
  let index = leafIndex

  for (let level = 0; level < tree.length - 1; level++) {
    const currentLevel = tree[level]
    if (index % 2 === 0) {
      const sibling =
        index + 1 < currentLevel.length
          ? currentLevel[index + 1]
          : currentLevel[index]
      proof.push({ hash: bytesToHex(sibling), direction: 1 })
    } else {
      const sibling = currentLevel[index - 1]
      proof.push({ hash: bytesToHex(sibling), direction: 0 })
    }
    index = Math.floor(index / 2)
  }

  return proof
}

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------

/**
 * allowlist to build the Merkle tree
 * and compute a proof for the given address.
 * Returns null if the address is not in the list.
 */
export function computeProofFromList(
  addressList: string[],
  address: string
): { proof: { hash: string; direction: number }[]; root: string } | null {
  const leaves = addressList.map((addr) => addressToLeaf(addr))
  const myLeaf = addressToLeaf(address)
  const myHex = bytesToHex(myLeaf)
  const myIndex = leaves.findIndex((leaf) => bytesToHex(leaf) === myHex)

  if (myIndex === -1) return null

  const tree = buildMerkleTree(leaves)
  return {
    proof: getMerkleProof(tree, myIndex),
    root: bytesToHex(getMerkleRoot(tree)),
  }
}

/**
 * The channel's merkle_uri (IPFS pointer to address list JSON),
 * fetch the list, build the tree, and compute a proof for the given address.
 * Returns null if the address is not in the allowlist.
 */
export async function computeProofForAddress(
  merkleUri: string,
  address: string,
): Promise<{
  proof: { hash: string; direction: number }[]
  root: string
} | null> {
  const cid = merkleUri.replace('ipfs://', '')
  const gw = import.meta.env.VITE_IPFS_DEFAULT_GATEWAY
  const url = CIDToURL(cid, gw === 'CDN' ? 'IPFS' : gw, { size: 'raw' })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch allowlist: ${res.status}`)
  const addressList: string[] = await res.json()
  return computeProofFromList(addressList, address)
}

/**
 * Build a Merkle root from a list of addresses.
 * Used by the creator when setting up an allowlist.
 */
export function computeMerkleRoot(addresses: string[]): string {
  const leaves = addresses.map((addr) => addressToLeaf(addr))
  const tree = buildMerkleTree(leaves)
  return bytesToHex(getMerkleRoot(tree))
}
