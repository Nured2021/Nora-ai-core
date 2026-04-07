'use client'

import { useEffect, useRef, useCallback } from 'react'
import { WsMessage } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export function useGlobalFeed(onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/ws/feed`)
      wsRef.current = ws

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as WsMessage
          onMessageRef.current(data)
        } catch {}
      }

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }

      // Ping keep-alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 30000)

      ws.onclose = () => {
        clearInterval(pingInterval)
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])
}

export function useJobFeed(jobId: string | null, onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!jobId) return
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/ws/jobs/${jobId}`)
      wsRef.current = ws

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as WsMessage
          onMessageRef.current(data)
        } catch {}
      }

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 30000)

      ws.onerror = () => ws.close()

      ws.onclose = () => {
        clearInterval(pingInterval)
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [jobId])
}
