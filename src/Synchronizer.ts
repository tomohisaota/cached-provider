import {CacheEvent} from "./types";

type Ref = {
    readonly p: Promise<void>
    readonly count: number
}

export class Synchronizer {
    private readonly holders: { [key: string]: Ref } = {}

    async synchronized<T>(
        {key, cb}: {
            key: string, cb: () => Promise<T>
        }): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const ref = this.holders[key] ?? {
                p: Promise.resolve(),
                count: 0
            }
            this.holders[key] = {
                p: ref.p.then(async () =>
                    cb().then(resolve).catch(reject)
                ).then(async () =>
                    this.release({key})
                ),
                count: ref.count + 1,
            }
        })
    }

    private async release(
        {key}: {
            key: string
        }): Promise<void> {
        const ref = this.holders[key]
        if (!ref) {
            // This should not happen.
            return
        }
        if (ref.count === 1) {
            // Last execution.
            // Remove promise from holders
            delete this.holders[key]
        } else {
            // Decrement ref counter
            this.holders[key] = {
                p: ref.p,
                count: ref.count - 1
            }
        }
    }

}