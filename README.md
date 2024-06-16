# cached-provider

Optimize data creation by synchronizing and caching

# How to install

```shell
# Not released yet!!
# npm install cacheable-request
```

# How to use

## Lazy Cache

Call provider once, and keep the result until TTL.

```typescript
const value = cached({
    ttl: 1000 * 60,// Cache TTL for get
    provider: async () => "slow data provider"
})
await value() // Access Value
```

## Eager Cache
In addition to lazy caching, run cache update automatically to minimize get latency

```typescript
const value = cached({
    ttl: 1000 * 60,// Cache TTL for get
    provider: async () => "slow data provider",
    autoUpdater: {
        interval: 1000 * 5, // Validate cache every 5 sec
        ttl: 1000 * 50, // Cache TTL for update , which should be smaller than TTL for get
    }
})
await value() // Access Value
```

## Smart Eager Cache

Adjust cache update interval based on user access.

```typescript
const value = cached({
    ttl: 1000 * 60 * 60,
    provider: async () => "slow data provider",
    autoUpdater: {
        interval: 1000 * 5, // Validate cache every 5 sec
        ttl: ({lastAccessed}) => {
            // Cache TTL for update , which should be smaller than TTL for get
            // Use longer update cycle when the value is not accessed
            const shortTTL = 1000 * 50
            const longTTL = 1000 * 60 * 59
            if (!lastAccessed) {
                return longTTL
            }
            const timeFromLastAccess = new Date().getTime() - lastAccessed.getTime()
            const isActive = timeFromLastAccess < 1000 * 60 * 10
            return isActive ? shortTTL : longTTL
        }
    }
})
await value() // Access Value
```

# How to shut down auto updater

If you specify onShouldContinue callback, cached provider ask you if it can continue running auto updater.

See example/example.ts for detail

```typescript
export type CachedProviderOptions<T> = {
    autoUpdater?: {
        onShouldContinue?: () => boolean
    }
}
```

# Monitoring Cache Behavior

onEvent callback allow you to monitor cache access in detail

See example/example.ts for detail

```typescript
export type CachedProviderOptions<T> = {
    onEvent?: CacheEventCallback
}
```

```typescript
export type MethodType = "get" | "update"
export type EventType = "hitA" | "hitS" | "miss"

export type CacheEvent = {
    methodType: MethodType
    eventType: EventType
    requestAt: Date
    responseAt: Date
    cachedAt: Date
}

export type CacheEventCallback = (event: CacheEvent) => void

```

## MethodType

| type   | description                    |
|--------|--------------------------------|
| get    | Get method call (on demand)    |
| update | Update method call (scheduled) |

## EventType

| type | description                                  |
|------|----------------------------------------------|
| hitA | Cache hit before synchronization. Super fast |
| hitS | Cache hit after synchronization. Fast        |
| miss | Cache miss, updated value. Slow              |

# License

This project is under the MIT license.
Copyright (c) 2024 Tomohisa Ota