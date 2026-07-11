import api from './api'

let registration: ServiceWorkerRegistration | null = null

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch {
    return null
  }
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { data } = await api.get('/push/vapid-public-key')
    return data.publicKey
  } catch {
    return null
  }
}

export async function subscribePush(): Promise<boolean> {
  if (!registration) {
    await registerServiceWorker()
  }
  if (!registration) return false

  const hasPermission = await requestPermission()
  if (!hasPermission) return false

  const publicKey = await getVapidPublicKey()
  if (!publicKey) return false

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    const subJson = subscription.toJSON()
    await api.post('/push/subscribe', {
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh || '',
      auth: subJson.keys?.auth || '',
    })

    return true
  } catch {
    return false
  }
}

export async function unsubscribePush(): Promise<boolean> {
  if (!registration) return false
  try {
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return true

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await api.post('/push/unsubscribe', { endpoint })
    return true
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
