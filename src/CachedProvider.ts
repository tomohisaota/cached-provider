import {CachedLazyProvider} from "./CachedLazyProvider";
import {CachedProviderOptions} from "./types";

export class CachedProvider<T> extends CachedLazyProvider<T> {

    constructor(options: CachedProviderOptions<T>) {
        super(options)
        if (options.autoUpdater) {
            this.start(options.autoUpdater)
        }
    }

    timer: NodeJS.Timeout | null = null

    start({interval, onShouldContinue, onError}: {
        interval: number,
        onShouldContinue?: () => boolean
        onError?: (err: unknown) => void
    }) {
        this.stop()
        this.timer = setInterval(async () => {
            if (onShouldContinue && !onShouldContinue()) {
                this.stop()
                return
            }
            try {
                await this.update()
            } catch (e) {
                if (onError) {
                    onError(e)
                }
            }
        }, interval)
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
    }
}
