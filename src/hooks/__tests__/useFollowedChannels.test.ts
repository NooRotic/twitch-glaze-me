import { describe, it, expect } from 'vitest'
import { sortFollows } from '../useFollowedChannels'
import type { EnrichedFollow } from '../useFollowedChannels'

function makeFollow(
  name: string,
  opts: {
    isLive?: boolean
    viewerCount?: number
  } = {},
): EnrichedFollow {
  return {
    broadcaster_id: name.toLowerCase(),
    broadcaster_login: name.toLowerCase(),
    broadcaster_name: name,
    followed_at: '2026-01-01T00:00:00Z',
    isLive: opts.isLive ?? false,
    viewerCount: opts.viewerCount,
  }
}

describe('sortFollows', () => {
  describe('live-first (default)', () => {
    it('puts live channels before offline channels', () => {
      const input = [
        makeFollow('alpha'),
        makeFollow('beta', { isLive: true }),
        makeFollow('gamma'),
        makeFollow('delta', { isLive: true }),
      ]
      const sorted = sortFollows(input, { mode: 'live-first', dir: 'desc' })
      const names = sorted.map((f) => f.broadcaster_name)
      // live must come before offline
      expect(names.indexOf('beta')).toBeLessThan(names.indexOf('alpha'))
      expect(names.indexOf('delta')).toBeLessThan(names.indexOf('alpha'))
      expect(names.indexOf('beta')).toBeLessThan(names.indexOf('gamma'))
      expect(names.indexOf('delta')).toBeLessThan(names.indexOf('gamma'))
    })

    it('sorts live channels by viewer count descending within live group', () => {
      const input = [
        makeFollow('zulu', { isLive: true, viewerCount: 100 }),
        makeFollow('alpha', { isLive: true, viewerCount: 500 }),
        makeFollow('bravo', { isLive: true, viewerCount: 250 }),
        makeFollow('yankee'),
      ]
      const sorted = sortFollows(input, { mode: 'live-first', dir: 'desc' })
      expect(sorted.map((f) => f.broadcaster_name)).toEqual([
        'alpha',
        'bravo',
        'zulu',
        'yankee',
      ])
    })

    it('sorts offline channels alphabetically', () => {
      const input = [
        makeFollow('zulu', { isLive: true, viewerCount: 100 }),
        makeFollow('charlie'),
        makeFollow('alpha'),
        makeFollow('bravo'),
      ]
      const sorted = sortFollows(input, { mode: 'live-first', dir: 'desc' })
      expect(sorted.map((f) => f.broadcaster_name)).toEqual([
        'zulu',
        'alpha',
        'bravo',
        'charlie',
      ])
    })

    it('handles all-live or all-offline sets', () => {
      const allLive = [
        makeFollow('charlie', { isLive: true, viewerCount: 100 }),
        makeFollow('alpha', { isLive: true, viewerCount: 300 }),
        makeFollow('bravo', { isLive: true, viewerCount: 200 }),
      ]
      // desc: alpha(300) > bravo(200) > charlie(100)
      expect(
        sortFollows(allLive, { mode: 'live-first', dir: 'desc' }).map((f) => f.broadcaster_name),
      ).toEqual(['alpha', 'bravo', 'charlie'])

      const allOffline = [
        makeFollow('charlie'),
        makeFollow('alpha'),
        makeFollow('bravo'),
      ]
      expect(
        sortFollows(allOffline, { mode: 'live-first', dir: 'desc' }).map((f) => f.broadcaster_name),
      ).toEqual(['alpha', 'bravo', 'charlie'])
    })

    it('is case-insensitive on broadcaster_name comparison', () => {
      const input = [
        makeFollow('Zebra'),
        makeFollow('apple'),
        makeFollow('Banana'),
      ]
      const sorted = sortFollows(input, { mode: 'live-first', dir: 'desc' })
      expect(sorted.map((f) => f.broadcaster_name)).toEqual([
        'apple',
        'Banana',
        'Zebra',
      ])
    })
  })

  describe('alpha', () => {
    it('sorts live above offline, then alphabetically within each group', () => {
      const input = [
        makeFollow('zulu', { isLive: true }),
        makeFollow('alpha'),
        makeFollow('bravo', { isLive: true }),
        makeFollow('yankee'),
      ]
      const sorted = sortFollows(input, { mode: 'alpha', dir: 'asc' })
      expect(sorted.map((f) => f.broadcaster_name)).toEqual([
        'bravo',
        'zulu',
        'alpha',
        'yankee',
      ])
    })

    it('sorts descending (Z-A) with dir=desc', () => {
      const input = [
        makeFollow('alpha'),
        makeFollow('bravo'),
        makeFollow('charlie'),
      ]
      const sorted = sortFollows(input, { mode: 'alpha', dir: 'desc' })
      expect(sorted.map((f) => f.broadcaster_name)).toEqual([
        'charlie',
        'bravo',
        'alpha',
      ])
    })
  })

  describe('viewers', () => {
    it('sorts live channels by viewer count descending', () => {
      const input = [
        makeFollow('a', { isLive: true, viewerCount: 100 }),
        makeFollow('b', { isLive: true, viewerCount: 500 }),
        makeFollow('c', { isLive: true, viewerCount: 250 }),
      ]
      const sorted = sortFollows(input, { mode: 'viewers', dir: 'desc' })
      expect(sorted.map((f) => f.broadcaster_name)).toEqual(['b', 'c', 'a'])
    })

    it('puts live channels before offline, live by viewers desc then offline alpha asc', () => {
      const input = [
        makeFollow('offline-b'),
        makeFollow('live-small', { isLive: true, viewerCount: 10 }),
        makeFollow('offline-a'),
        makeFollow('live-big', { isLive: true, viewerCount: 1000 }),
      ]
      // dir=asc: live sorted asc by viewers (small first), offline sorted asc by name
      const sortedAsc = sortFollows(input, { mode: 'viewers', dir: 'asc' })
      expect(sortedAsc.map((f) => f.broadcaster_name)).toEqual([
        'live-small',
        'live-big',
        'offline-a',
        'offline-b',
      ])

      // dir=desc: live sorted desc by viewers (big first), offline sorted desc by name (b before a)
      const sortedDesc = sortFollows(input, { mode: 'viewers', dir: 'desc' })
      expect(sortedDesc.map((f) => f.broadcaster_name)).toEqual([
        'live-big',
        'live-small',
        'offline-b',
        'offline-a',
      ])
    })

    it('treats missing viewerCount as 0 for live channels', () => {
      const input = [
        makeFollow('a', { isLive: true, viewerCount: 100 }),
        makeFollow('b', { isLive: true }),
        makeFollow('c', { isLive: true, viewerCount: 50 }),
      ]
      const sorted = sortFollows(input, { mode: 'viewers', dir: 'desc' })
      expect(sorted.map((f) => f.broadcaster_name)).toEqual(['a', 'c', 'b'])
    })
  })

  it('does not mutate the input array', () => {
    const input = [
      makeFollow('zulu', { isLive: true }),
      makeFollow('alpha'),
    ]
    const before = [...input]
    sortFollows(input, { mode: 'alpha', dir: 'asc' })
    expect(input).toEqual(before)
  })

  it('returns an empty array for an empty input', () => {
    expect(sortFollows([], { mode: 'live-first', dir: 'desc' })).toEqual([])
    expect(sortFollows([], { mode: 'alpha', dir: 'asc' })).toEqual([])
    expect(sortFollows([], { mode: 'viewers', dir: 'desc' })).toEqual([])
  })
})
