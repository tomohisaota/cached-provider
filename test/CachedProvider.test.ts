import {CachedProvider} from "../src/CachedProvider";

describe("CachedProvider", () => {
    test('shouldContinue can stop autoUpdater', async () => {
        const h = {
            shouldContinue: true
        }
        const interval = 100
        const idm = new CachedProvider({
            ttl: 100,
            provider: async () => "aaa",
            autoUpdater: {
                interval,
                ttl: 100,
                onShouldContinue: () => h.shouldContinue
            }
        })
        expect(idm.isRunning).toEqual(true)
        await new Promise(r => setTimeout(r, interval * 3))
        expect(idm.isRunning).toEqual(true)
        h.shouldContinue = false
        await new Promise(r => setTimeout(r, interval * 3))
        expect(idm.isRunning).toEqual(false)
    });

    test('start/stop works', async () => {
        const interval = 100
        const idm = new CachedProvider({
            ttl: 100,
            provider: async () => "aaa",
        })
        expect(idm.isRunning).toEqual(false)
        idm.start({
            interval,
        })
        expect(idm.isRunning).toEqual(true)
        idm.stop()
        expect(idm.isRunning).toEqual(false)
    });

})
