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

// async function docSamples() {
//     {
//         const value = cached({
//             ttl: 1000 * 60,// Cache TTL for get
//             provider: async () => "slow data provider"
//         })
//         await value() // Access Value
//     }
//     {
//         const value = cached({
//             ttl: 1000 * 60,// Cache TTL for get
//             provider: async () => "slow data provider",
//             autoUpdater: {
//                 interval: 1000 * 5, // Validate cache every 5 sec
//                 ttl: 1000 * 50, // Cache TTL for update , which should be smaller than TTL for get
//             }
//         })
//         await value() // Access Value
//     }
//     {
//         const value = cached({
//             ttl: 1000 * 60 * 60,
//             provider: async () => "slow data provider",
//             autoUpdater: {
//                 interval: 1000 * 5, // Validate cache every 5 sec
//                 ttl: ({lastAccessed}) => {
//                     // Cache TTL for update , which should be smaller than TTL for get
//                     // Use longer update cycle when the value is not accessed
//                     const shortTTL = 1000 * 50
//                     const longTTL = 1000 * 60 * 59
//                     if (!lastAccessed) {
//                         return longTTL
//                     }
//                     const timeFromLastAccess = new Date().getTime() - lastAccessed.getTime()
//                     const isActive = timeFromLastAccess < 1000 * 60 * 10
//                     return isActive ? shortTTL : longTTL
//                 }
//             }
//         })
//         await value() // Access Value
//     }
// }

main()

