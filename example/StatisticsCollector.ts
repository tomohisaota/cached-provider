import {CacheEvent, EventType, MethodType} from "../src/types";

type Stats = {
    readonly count: number,
    readonly min: number,
    readonly avg: number,
    readonly max: number,
}

type CachedProviderStatistics = {
    readonly [key in MethodType]: {
        readonly [key in EventType]?: Stats
    }
}

export class StatisticsCollector {

    private _stats: CachedProviderStatistics = {
        "get": {},
        "update": {},
    }

    collect({methodType, eventType, requestAt, responseAt}: CacheEvent) {
        const s = this._stats[methodType][eventType]
        const latency = responseAt.getTime() - requestAt.getTime()
        if (!s) {
            this._stats = {
                ...this._stats,
                [methodType]: {
                    ...this._stats[methodType],
                    [eventType]: {
                        count: 1,
                        min: latency,
                        avg: latency,
                        max: latency,
                    }
                }
            }
        } else {
            this._stats = {
                ...this._stats,
                [methodType]: {
                    ...this._stats[methodType],
                    [eventType]: {
                        count: s.count + 1,
                        min: Math.min(s.min, latency),
                        avg: (s.avg * s.count + latency) / (s.count + 1),
                        max: Math.max(s.max, latency),
                    }
                }
            }
        }
    }

    reset() {
        this._stats = {
            "get": {},
            "update": {},
        }
    }

    get asTable() {
        const result: ({
            methodType: MethodType,
            eventType: EventType
        } & Stats)[] = []

        for (const methodType of Object.keys(this._stats).sort() as MethodType[]) {
            for (const eventType of Object.keys(this._stats[methodType]).sort() as EventType[]) {
                const s = this._stats[methodType][eventType]!
                result.push({
                    methodType, eventType,
                    ...s,
                    avg: Math.round(s.avg)
                })
            }
        }
        return result
    }
}