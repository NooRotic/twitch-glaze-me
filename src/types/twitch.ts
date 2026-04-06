export interface TwitchUser {
  id: string
  login: string
  display_name: string
  type: string
  broadcaster_type: 'partner' | 'affiliate' | ''
  description: string
  profile_image_url: string
  offline_image_url: string
  view_count: number
  created_at: string
}

export interface TwitchChannel {
  broadcaster_id: string
  broadcaster_login: string
  broadcaster_name: string
  broadcaster_language: string
  game_id: string
  game_name: string
  title: string
  delay: number
  tags: string[]
  content_classification_labels: string[]
  is_branded_content: boolean
}

export interface TwitchStream {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  type: 'live' | ''
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  is_mature: boolean
  tags: string[]
}

export interface TwitchClip {
  id: string
  url: string
  embed_url: string
  broadcaster_id: string
  broadcaster_name: string
  creator_id: string
  creator_name: string
  video_id: string
  game_id: string
  language: string
  title: string
  view_count: number
  created_at: string
  thumbnail_url: string
  duration: number
  vod_offset: number | null
}

export interface TwitchVideo {
  id: string
  stream_id: string
  user_id: string
  user_login: string
  user_name: string
  title: string
  description: string
  created_at: string
  published_at: string
  url: string
  thumbnail_url: string
  viewable: string
  view_count: number
  language: string
  type: 'upload' | 'archive' | 'highlight'
  duration: string
}

export interface TwitchGame {
  id: string
  name: string
  box_art_url: string
  igdb_id: string
}

export interface TwitchEmote {
  id: string
  name: string
  images: {
    url_1x: string
    url_2x: string
    url_4x: string
  }
  tier?: string
  emote_type: string
  emote_set_id: string
  format: string[]
  scale: string[]
  theme_mode: string[]
}

export interface TwitchBadge {
  set_id: string
  versions: {
    id: string
    image_url_1x: string
    image_url_2x: string
    image_url_4x: string
    title: string
    description: string
  }[]
}

export interface TwitchFollowedChannel {
  broadcaster_id: string
  broadcaster_login: string
  broadcaster_name: string
  followed_at: string
}
