import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { TMNT_MESSAGING_CONTRACT } from '@constants'
import { getTzktData } from '@data/api'
import { useStorage } from '@data/swr'
import { useUserStore } from '@context/userStore'

export function useMessagingStorage() {
  return useStorage(TMNT_MESSAGING_CONTRACT)
}

export function useUserThreads(address, storage, offset = 0, limit = 20) {
  const bigmap = storage?.thread_participants
  const params = {
    'key.participant': address,
    'sort.desc': 'lastLevel',
    offset,
    limit,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    address && bigmap ? [`/v1/bigmaps/${bigmap}/keys`, params] : null,
    getTzktData
  )

  const threadIds = data?.map((item) => item.key.thread_id) || []

  return [threadIds, data, mutate]
}

export function useThreadDetails(threadIds, storage) {
  const threadInfoBigmap = storage?.thread_info
  const messagesBigmap = storage?.messages
  const participantsBigmap = storage?.thread_participants

  const ids = threadIds?.join(',')
  const single = threadIds?.length === 1
  const keyFilter = single ? { 'key.eq': ids } : { 'key.in': ids }
  const threadKeyFilter = single
    ? { 'key.thread_id.eq': ids }
    : { 'key.thread_id.in': ids }

  const infoParams = {
    ...keyFilter,
    active: true,
    select: 'key,value',
    limit: 100,
  }

  const msgParams = {
    ...keyFilter,
    active: true,
    select: 'key,value',
    limit: 100,
  }

  const partParams = {
    ...threadKeyFilter,
    active: true,
    select: 'key,value',
    limit: 500,
  }

  const { data: infoData } = useSWR(
    ids && threadInfoBigmap
      ? [`/v1/bigmaps/${threadInfoBigmap}/keys`, infoParams]
      : null,
    getTzktData
  )

  const { data: msgData } = useSWR(
    ids && messagesBigmap
      ? [`/v1/bigmaps/${messagesBigmap}/keys`, msgParams]
      : null,
    getTzktData
  )

  const { data: partData } = useSWR(
    ids && participantsBigmap
      ? [`/v1/bigmaps/${participantsBigmap}/keys`, partParams]
      : null,
    getTzktData
  )

  if (!infoData || !msgData || !partData) return [undefined]

  const infoMap = {}
  infoData.forEach((item) => {
    infoMap[item.key] = item.value
  })

  const msgMap = {}
  msgData.forEach((item) => {
    msgMap[item.key] = {
      ...item.value,
      content: item.value.content ? bytesToString(item.value.content) : '',
    }
  })

  const partMap = {}
  partData.forEach((item) => {
    const tid = item.key.thread_id
    if (!partMap[tid]) partMap[tid] = []
    partMap[tid].push(item.key.participant)
  })

  const details = {}
  threadIds.forEach((id) => {
    details[id] = {
      info: infoMap[id],
      rootMessage: msgMap[id],
      participants: partMap[id] || [],
    }
  })

  return [details]
}

export function useThreadMessages(threadId, storage) {
  const messagesBigmap = storage?.messages

  // Root message
  const { data: rootData } = useSWR(
    threadId && messagesBigmap
      ? `/v1/bigmaps/${messagesBigmap}/keys/${threadId}`
      : null,
    getTzktData
  )

  // Replies
  const replyParams = {
    'value.parent_id': threadId,
    'sort.asc': 'id',
    limit: 50,
    active: true,
    select: 'key,value',
  }
  const { data: replyData, mutate } = useSWR(
    threadId && messagesBigmap
      ? [`/v1/bigmaps/${messagesBigmap}/keys`, replyParams]
      : null,
    getTzktData
  )

  if (!rootData || !replyData) return [undefined, mutate]

  const rootMessage = {
    id: rootData.key,
    ...rootData.value,
    content: rootData.value?.content
      ? bytesToString(rootData.value.content)
      : '',
  }

  const replies = replyData.map((item) => ({
    id: item.key,
    ...item.value,
    content: item.value.content ? bytesToString(item.value.content) : '',
  }))

  return [[rootMessage, ...replies], mutate]
}

export function useThreadInfo(threadId, storage) {
  const bigmap = storage?.thread_info
  const { data, mutate } = useSWR(
    threadId && bigmap ? `/v1/bigmaps/${bigmap}/keys/${threadId}` : null,
    getTzktData
  )

  return [data?.value, mutate]
}

export function useThreadParticipants(threadId, storage) {
  const bigmap = storage?.thread_participants
  const params = {
    'key.thread_id': threadId,
    active: true,
    select: 'key,value',
    limit: 100,
  }
  const { data, mutate } = useSWR(
    threadId && bigmap ? [`/v1/bigmaps/${bigmap}/keys`, params] : null,
    getTzktData
  )

  const participants = data?.map((item) => item.key.participant) || []
  return [participants, mutate]
}

export function useReadStatus(address, messageIds, storage) {
  const bigmap = storage?.read_status
  const ids = messageIds?.join(',')
  const params = {
    'key.reader': address,
    'key.message_id.in': ids,
    active: true,
    select: 'key,value',
    limit: 500,
  }
  const { data, mutate } = useSWR(
    address && ids && bigmap ? [`/v1/bigmaps/${bigmap}/keys`, params] : null,
    getTzktData
  )

  const readSet = new Set()
  data?.forEach((item) => readSet.add(item.key.message_id))

  return [readSet, mutate]
}

export function useUnreadCount(address, storage) {
  const recipientsBigmap = storage?.recipients
  const readStatusBigmap = storage?.read_status

  const recipientParams = {
    'key.recipient': address,
    active: true,
    select: 'key,value',
    limit: 10000,
  }
  const readParams = {
    'key.reader': address,
    active: true,
    select: 'key,value',
    limit: 10000,
  }

  const { data: recipientData } = useSWR(
    address && recipientsBigmap
      ? [`/v1/bigmaps/${recipientsBigmap}/keys`, recipientParams]
      : null,
    getTzktData,
    { refreshInterval: 30000 }
  )

  const { data: readData } = useSWR(
    address && readStatusBigmap
      ? [`/v1/bigmaps/${readStatusBigmap}/keys`, readParams]
      : null,
    getTzktData,
    { refreshInterval: 30000 }
  )

  if (!recipientData) return [0]

  const receivedIds = new Set(recipientData.map((item) => item.key.message_id))
  const readIds = new Set((readData || []).map((item) => item.key.message_id))

  let count = 0
  receivedIds.forEach((id) => {
    if (!readIds.has(id)) count++
  })

  return [count]
}

export function useGlobalUnreadCount() {
  const address = useUserStore((st) => st.address)
  const [storage] = useMessagingStorage()
  return useUnreadCount(address, storage)
}

export function useMessageFee(storage) {
  return storage?.message_fee ? parseInt(storage.message_fee) : 0
}
