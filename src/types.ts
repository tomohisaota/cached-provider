export type TTLProvider = number | ((args: {
    lastUpdated?: Date,
    lastAccessed?: Date
}) => number)

export type ValueProvider<T> = () => Promise<T>

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

export type CachedProviderOptions<T> = {
    ttl: TTLProvider
    provider: ValueProvider<T>
    onEvent?: CacheEventCallback
    autoUpdater?: {
        interval: number,
        ttl?: TTLProvider
        onShouldContinue?: () => boolean
        onError?: (err: unknown) => void
    }
}

