import {synchronized} from "./synchronized";
import {CachedProviderOptions, EventType, MethodType, TTLProvider} from "./types";

type Holder<T> = {
    readonly cachedObj: T
    readonly cachedAt: Date
}

export class CachedLazyProvider<T> {

    readonly options: CachedProviderOptions<T> & Required<Pick<CachedProviderOptions<T>, "onEvent">>

    cacheHolder?: Holder<T>

    accessedAt?: Date

    constructor(options: CachedProviderOptions<T>) {
        this.options = {
            onEvent: () => {
            },
            ...options
        }
    }

    async get(): Promise<T> {
        this.accessedAt = new Date()
        return this._getOrUpdateThenEmit("get")
    }

    async update(): Promise<void> {
        await this._getOrUpdateThenEmit("update")
    }

    private async _getOrUpdateThenEmit(methodType: MethodType): Promise<T> {
        const requestAt = new Date()
        const eventType = await this._getOrUpdate(methodType)
        const responseAt = new Date()
        const {accessedAt} = this
        const {cachedObj, cachedAt} = this.cacheHolder!
        this.options.onEvent({
            cachedObj, cachedAt, accessedAt,
            eventType, methodType, requestAt, responseAt,
        })
        return cachedObj
    }

    private async _getOrUpdate(type: MethodType): Promise<EventType> {
        const ttl = type === "get"
            ? this.options.ttl
            : this.options.autoUpdater?.ttl ?? this.options.ttl
        if (isValid({ttl, holder: this.cacheHolder, accessedAt: this.accessedAt})) {
            return "hitA"
        }
        return synchronized(this)(
            async () => {
                if (isValid({ttl, holder: this.cacheHolder, accessedAt: this.accessedAt})) {
                    return "hitS"
                }
                // Update Cache
                this.cacheHolder = {
                    cachedObj: await this.options.provider(),
                    cachedAt: new Date()
                }
                return "miss"
            }
        )
    }
}


export function getTimeToLive<T>({now, ttl, holder, accessedAt}: {
    now?: number // for testing
    ttl: TTLProvider<T>,
    holder: Holder<T>,
    accessedAt?: Date
}): number {
    if (typeof ttl === 'number') {
        return ttl
    }
    now = now ?? new Date().getTime()
    return ttl({
        ...holder,
        accessedAt,
        //
        now,
        sinceCachedAt: now - holder.cachedAt.getTime(),
        sinceAccessedAt: accessedAt
            ? now - accessedAt.getTime()
            : undefined
    })
}

export function isValid<T>({now, ttl, holder, accessedAt}: {
    now?: number // for testing
    ttl: TTLProvider<T>,
    holder?: Holder<T>,
    accessedAt?: Date
}): boolean {
    if (holder === undefined) {
        return false
    }
    now = now ?? new Date().getTime()
    const elapsed = now - holder.cachedAt.getTime()
    const timeUntilExpire = getTimeToLive({now, ttl, holder, accessedAt}) - elapsed
    return timeUntilExpire >= 0
}