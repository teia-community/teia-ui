import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { CHANNELS_V2_CONTRACT } from '@constants'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useModalStore } from '@context/modalStore'
import { useUserProfiles } from '@data/roles'
import {
  useAdminChannels,
  useRecentChannelMessages,
  useBannedList,
  usePauseState,
} from '@data/messaging/admin'
import {
  setChannelHidden,
  moderateMessageHidden,
  deleteMessage,
  setUserBanned,
  setPaused,
} from '@data/messaging/channel-actions'
import StatCard from './StatCard'
import ModerationTable from './ModerationTable'
import BanListManager from './BanListManager'
import PauseToggle from './PauseToggle'
import styles from '@style'

function preview(text, len = 90) {
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  return t.length > len ? t.slice(0, len) + '…' : t || '(empty)'
}

export default function ChannelsAdmin() {
  const {
    data: channels,
    isLoading: loadingChannels,
    mutate: refreshChannels,
  } = useAdminChannels()
  const {
    data: messages,
    isLoading: loadingMessages,
    mutate: refreshMessages,
  } = useRecentChannelMessages()
  const { data: banned = [], mutate: refreshBanned } =
    useBannedList(CHANNELS_V2_CONTRACT)
  const { data: paused, mutate: refreshPaused } =
    usePauseState(CHANNELS_V2_CONTRACT)

  const ask = useModalStore((st) => st.ask)
  const [busyChannel, setBusyChannel] = useState(null)
  const [busyMsg, setBusyMsg] = useState(null)

  const openChannels = useMemo(
    () => (channels ?? []).filter((c) => c.accessMode === 'unrestricted'),
    [channels]
  )
  const openMessages = useMemo(
    () =>
      (messages ?? []).filter((m) => m.channelAccessMode === 'unrestricted'),
    [messages]
  )

  const addrs = useMemo(() => {
    const set = new Set(banned)
    for (const c of openChannels) set.add(c.creator)
    for (const m of openMessages) set.add(m.sender)
    return [...set]
  }, [openChannels, openMessages, banned])
  const { data: profiles = {} } = useUserProfiles(addrs)

  const stats = useMemo(() => {
    return {
      channels: openChannels.length,
      hiddenChannels: openChannels.filter((c) => c.hidden).length,
      hiddenMessages: openMessages.filter((m) => m.hidden).length,
    }
  }, [openChannels, openMessages])

  const alias = (a) => profiles[a]?.alias || walletPreview(a)

  const toggleChannelHidden = async (c) => {
    setBusyChannel(c.id)
    try {
      await setChannelHidden(c.id, !c.hidden)
      refreshChannels()
    } catch {
      // surfaced via modal
    } finally {
      setBusyChannel(null)
    }
  }

  const toggleMessageHidden = async (m) => {
    setBusyMsg(m.id)
    try {
      await moderateMessageHidden({
        messageId: m.id,
        channelId: m.channelId,
        hidden: !m.hidden,
      })
      refreshMessages()
    } catch {
      // surfaced via modal
    } finally {
      setBusyMsg(null)
    }
  }

  const removeMessage = async (m) => {
    const ok = await ask(
      'Delete message',
      'This permanently deletes the message on-chain. Continue?'
    )
    if (!ok) return
    setBusyMsg(m.id)
    try {
      await deleteMessage({ messageId: m.id, channelId: m.channelId })
      refreshMessages()
    } catch {
      // surfaced via modal
    } finally {
      setBusyMsg(null)
    }
  }

  const banUser = async (address) => {
    await setUserBanned({ address, banned: true })
    refreshBanned()
  }
  const unbanUser = async (address) => {
    await setUserBanned({ address, banned: false })
    refreshBanned()
  }
  const togglePause = async (next) => {
    await setPaused(next)
    refreshPaused()
  }

  const renderChannelRow = (c) => (
    <tr key={c.id} className={c.hidden ? styles.row_hidden : ''}>
      <td>
        <Link to={`/inbox/channels/${c.id}`}>{c.name}</Link>
        {c.hidden && <span className={styles.hidden_tag}> (hidden)</span>}
      </td>
      <td>
        <Link to={`/tz/${c.creator}`}>{alias(c.creator)}</Link>
      </td>
      <td className={styles.muted}>{c.messageCount}</td>
      <td className={styles.muted}>{getTimeAgo(c.createdAt)}</td>
      <td className={styles.row_actions}>
        <Button small shadow_box to={`/inbox/channels/${c.id}`}>
          View
        </Button>
        <Button
          small
          shadow_box
          disabled={busyChannel === c.id}
          onClick={() => toggleChannelHidden(c)}
        >
          {c.hidden ? 'Unhide' : 'Hide'}
        </Button>
      </td>
    </tr>
  )

  const renderMessageRow = (m) => (
    <tr key={m.id} className={m.hidden ? styles.row_hidden : ''}>
      <td>
        <Link to={`/tz/${m.sender}`}>{alias(m.sender)}</Link>
      </td>
      <td className={styles.cell_content}>
        {preview(m.content)}
        {m.hidden && <span className={styles.hidden_tag}> (hidden)</span>}
      </td>
      <td>
        <Link to={`/inbox/channels/${m.channelId}`}>#{m.channelId}</Link>
      </td>
      <td className={styles.muted}>{getTimeAgo(m.timestamp)}</td>
      <td className={styles.row_actions}>
        <Button
          small
          shadow_box
          disabled={busyMsg === m.id}
          onClick={() => toggleMessageHidden(m)}
        >
          {m.hidden ? 'Unhide' : 'Hide'}
        </Button>
        <Button
          small
          shadow_box
          disabled={busyMsg === m.id}
          onClick={() => removeMessage(m)}
        >
          Delete
        </Button>
        <Button
          small
          shadow_box
          disabled={banned.includes(m.sender)}
          onClick={() => banUser(m.sender)}
        >
          {banned.includes(m.sender) ? 'Banned' : 'Ban'}
        </Button>
      </td>
    </tr>
  )

  return (
    <div className={styles.tab_body}>
      <div className={styles.stats}>
        <StatCard label="Channels" value={stats.channels} sublabel="recent" />
        <StatCard label="Hidden channels" value={stats.hiddenChannels} />
        <StatCard
          label="Hidden messages"
          value={stats.hiddenMessages}
          sublabel="in view"
        />
        <StatCard label="Banned users" value={banned.length} />
      </div>

      <p className={styles.muted}>
        Only open (unrestricted) channels are shown. Private, allowlist and
        direct-message channels are hidden here to avoid exposing their
        contents.
      </p>

      <h3 className={styles.section_head}>Channels</h3>
      {loadingChannels ? (
        <Loading message="Loading channels…" />
      ) : (
        <ModerationTable
          items={openChannels}
          headers={['Channel', 'Creator', 'Msgs', 'Created', 'Actions']}
          renderRow={renderChannelRow}
          searchText={(c) => `${c.name} ${c.creator} ${c.id}`}
          emptyLabel="No channels match."
        />
      )}

      <h3 className={styles.section_head}>Recent messages</h3>
      {loadingMessages ? (
        <Loading message="Loading messages…" />
      ) : (
        <ModerationTable
          items={openMessages}
          headers={['Author', 'Message', 'Channel', 'Posted', 'Actions']}
          renderRow={renderMessageRow}
          searchText={(m) => `${m.sender} ${m.content} ${m.channelId}`}
          emptyLabel="No messages match."
        />
      )}

      <PauseToggle
        label="Channels contract"
        paused={Boolean(paused)}
        onToggle={togglePause}
      />

      <BanListManager
        banned={banned}
        profiles={profiles}
        onBan={banUser}
        onUnban={unbanUser}
      />
    </div>
  )
}
