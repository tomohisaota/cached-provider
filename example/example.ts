import {cached} from "../src";
import {CachedProviderOptions} from "../src/types";
import {StatisticsCollector} from "./StatisticsCollector";

async function main() {
    // Prepare onShouldContinue callback to stop auto updater later
    const msgBox = {
        shouldContinue: true
    }
    const onShouldContinue = () => msgBox.shouldContinue

    // enable verbose mode if you want to see more logs
    const verbose = false
    await runner({
        verbose,
        label: "Lazy Cache",
        ttl: 1000,
    })

    await runner({
        verbose,
        label: "Lazy Cache with warmup",
        warmup: true,
        ttl: 1000,
    })

    await runner({
        verbose,
        label: "Eager Cache",
        ttl: 1000,
        autoUpdater: {
            ttl: 500,
            interval: 100,
            onShouldContinue,
        },
    })

    await runner({
        verbose,
        label: "Eager Cache with warmup",
        warmup: true,
        ttl: 100 * 10,
        autoUpdater: {
            ttl: 500,
            interval: 100,
            onShouldContinue,
        },
    })
    // Stop auto updater so that node program can terminate
    msgBox.shouldContinue = false
}

async function runner(args: {
    verbose: boolean,
    label: string,
    warmup?: boolean
} & Pick<CachedProviderOptions<string>, "ttl" | "autoUpdater">) {
    const numOfRuns = 50
    const s = new StatisticsCollector()

    const a = cached({
        ...args,
        provider: async () => {
            await new Promise(p => setTimeout(p, 300))
            return "data which takes long time to calc"
        },
        onEvent: s.collect.bind(s)
    })
    console.log(`Sample: ${args.label}`)
    if (args.warmup) {
        // Just get value once.
        await a()
        // Reset statistics
        s.reset()
    }
    for (let i = 0; i < numOfRuns; i++) {
        if (args.verbose) {
            console.log(`==${i}==`)
            console.log(`request:${i}`)
        }
        // Call a() without await
        // Without cached provider, it will call provider in parallel
        a().then(() => {
            if (args.verbose) {
                console.log(`response:${i}`)
            }
        })
        await new Promise(p => setTimeout(p, 100))
    }
    console.table(s.asTable)
}

main()

