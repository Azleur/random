import { rng, GetDefaultGenerator, RngProvider } from '.';
import { observe, validate } from 'statistics';

const SAMPLES = 8000;

test("rng returned by GetDefaultGenerator() returns uniform values in the range [0, 1)", () => {
    const generator: rng = GetDefaultGenerator();
    let stats = observe(() => generator(), SAMPLES);
    expect(
        validate(stats, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 1 / 12, })
    ).toBe(true);
});

test('Bernoulli works as expected', () => {
    const provider = new RngProvider();
    let stats = observe(() => (provider.Bernoulli() ? 1 : 0), SAMPLES);
    expect(
        validate(stats, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 0.25, })
    ).toBe(true);
    for (let p = 0.1; p <= 0.9; p += 0.2) {
        stats = observe(() => (provider.Bernoulli(p) ? 1 : 0), SAMPLES);
        expect(
            validate(stats, { tolerance: 0.1, mean: p, min: 0, max: 1, })
        ).toBe(true); // No idea about variance.
    }
});

test('UniformInt variants work as expected', () => {
    // No params: [0, MAX_SAFE_INTEGER).
    const provider = new RngProvider();
    let stats = observe(() => provider.UniformInt(), SAMPLES);
    // Positive values.
    expect(stats.mean >= 0).toBe(true);
    expect(stats.variance >= 0).toBe(true);
    expect(stats.min >= 0).toBe(true);
    expect(stats.max >= 0).toBe(true);
    // Integer values.
    expect(Math.floor(stats.min)).toBe(stats.min);
    expect(Math.floor(stats.max)).toBe(stats.max);

    // One param: [0, n).
    for (let n = 10; n < 30; n += 5) {
        stats = observe(() => provider.UniformInt(n), SAMPLES);
        expect(
            validate(
                stats,
                { tolerance: 0.1 * n, mean: (n - 1) / 2, min: 0, max: n - 1, variance: (n * n - 1) / 12, }
            )
        ).toBe(true);
        expect(Math.floor(stats.min)).toBe(stats.min);
        expect(Math.floor(stats.max)).toBe(stats.max);
    }

    // Two params: [min, max].
    for (let min = -20; min <= 20; min += 10) {
        for (let width = 4; width <= 19; width += 3) {
            let max = min + width;
            stats = observe(() => provider.UniformInt(min, max), SAMPLES);
            expect(
                validate(
                    stats,
                    {
                        tolerance: 0.1 * width,
                        mean: min + 0.5 * width,
                        min: min,
                        max: max,
                        variance: ((width + 1) * (width + 1) - 1) / 12,
                    }
                )
            ).toBe(true);
            expect(Math.floor(stats.min)).toBe(stats.min);
            expect(Math.floor(stats.max)).toBe(stats.max);
        }
    }
});

test('Uniform variants work as expected', () => {
    // No params: [0, 1).
    const provider = new RngProvider();
    let stats = observe(() => provider.Uniform(), SAMPLES);
    expect(
        validate(stats, { tolerance: 0.1, mean: 0.5, min: 0, max: 1, variance: 1 / 12, })
    ).toBe(true);

    // One param: [0, x).
    for (let x = 3.5; x <= 7.5; x += 2 / 3) {
        stats = observe(() => provider.Uniform(x), SAMPLES);
        expect(
            validate(stats, { tolerance: 0.1 * x, mean: x / 2, min: 0, max: x, variance: x * x / 12, })
        ).toBe(true);
    }

    // Two params: [min, max).
    for (let min = -6; min <= +6; min += 1.5) {
        for (let width = 1 / 3; width <= 5 / 3; width += 1 / 3) {
            let max = min + width;
            stats = observe(() => provider.Uniform(min, max), SAMPLES);
            expect(
                validate(
                    stats,
                    {
                        tolerance: 0.1 * width,
                        mean: min + 0.5 * width,
                        min: min,
                        max: max,
                        variance: width * width / 12,
                    }
                )
            ).toBe(true);
        }
    }
});

test('Dice works as expected', () => {
    const provider = new RngProvider();
    for (let dice = 1; dice <= 5; dice++) {
        for (let faces = 1; faces <= 8; faces++) {
            let sample = provider.Dice(dice, faces);
            expect(Math.floor(sample)).toBe(sample); // Integers.
            let stats = observe(() => provider.Dice(dice, faces), SAMPLES);
            expect(
                validate(
                    stats,
                    {
                        tolerance: 0.1 * dice * faces,
                        mean: (dice * (faces + 1)) / 2,
                        min: dice,
                        max: dice * faces,
                        // variance?
                    }
                )
            ).toBe(true);
        }
    }
});

test('Bates as expected', () => {
    const provider = new RngProvider();
    for (let min = -2; min <= 7; min += 3) {
        for (let width = 1; width < 2.5; width += 0.5) {
            const max = min + width;
            for (let n = 1; n <= 4; n++) {
                let stats = observe(() => provider.Bates(min, max, n), SAMPLES);
                expect(
                    validate(
                        stats,
                        {
                            tolerance: 0.1 * width,
                            mean: min + 0.5 * width,
                            min: min,
                            max: max,
                            variance: (width * width) / (12 * n),
                        }
                    )
                ).toBe(true);
            }
        }
    }
});
