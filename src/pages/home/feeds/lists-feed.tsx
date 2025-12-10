import useSWR from 'swr'
import TokenCollection from '@atoms/token-collection'
import { BaseTokenFieldsFragment } from '@data/api'
import { gql } from 'graphql-request'
import { Input } from '@atoms/input'
import { useState } from 'react'
import { Button } from '@atoms/button'


async function fetchList(url: string) {
  const response = await fetch(url)
  const data = await response.json()
  return data.map((e: string | number) => e.toString())
}

const lists = {
  'NSFW List': 'https://lists.teia.art/nsfw.json',
  'Photo Sensitive List': 'https://lists.teia.art/photosensitive.json',
  'Restricted OBJKTs (deprecated)':
    'https://lists.teia.art/restricted_objkt.json',
}

export function ListsFeed() {
  const [_url, _setUrl] = useState('')
  const [url, setUrl] = useState('')

  const { data: ids } = useSWR(
    ['/feed/lists', url],
    async () => fetchList(url),

    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  return (
    <>
      <div style={{ display: 'flex', gap: '1em' }}>
        {Object.keys(lists).map((k) => (
          <Button
            key={k}
            box
            onClick={() => {
              setUrl(lists[k as keyof typeof lists])
              _setUrl(lists[k as keyof typeof lists])
            }}
          >
            {k}
          </Button>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: '25px',
          alignItems: 'center',
          alignContent: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Input
          placeholder="link to a json list of tokens"
          type="text"
          value={_url}
          onChange={(e) => _setUrl(e as string)}
        />
        <Button
          onClick={() => {
            setUrl(_url)
          }}
          shadow_box
        >
          Search
        </Button>
      </div>

      {url && (
        <TokenCollection
          disable={!ids}
          label="Lists Feed"
          namespace="lists"
          variables={{ ids }}
          swrParams={[url]}
          query={gql`
            ${BaseTokenFieldsFragment}
            query fromList($ids: [String!], $limit: Int!) {
              tokens(
                where: { token_id: { _in: $ids } }
                order_by: { minted_at: desc }
                limit: $limit
              ) {
                ...baseTokenFields
              }
            }
          `}
        />
      )}
    </>
  )
}

export default ListsFeed
