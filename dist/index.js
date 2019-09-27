import { Interpolate } from 'math-utils';
/** Alias for the default unseeded rng (Math.random). */
const defaultGenerator = Math.random;
/** Returns the default unseeded rng (Math.random). */
export const GetDefaultGenerator = () => defaultGenerator;
/** Returns a seeded Linear Congruential Generator. */
export const GetLCG = (seed) => {
    const m = 1 << 31 - 1;
    const a = 48271;
    let state = seed || 123456;
    return () => {
        state = (state * a) % m;
        return state / m; // This is probably statistically problematic.
    };
};
// TODO: Add more generators.
// TODO: Write tests.
// TODO: Write docs.
/** Wrapper around the rng type that provides different distributions and utilities. */
export class RngProvider {
    constructor(generator) {
        /** Returns */
        this.Dice = (dice, faces) => {
            let accumulator = 0;
            for (let i = 0; i < dice; i++) {
                accumulator += 1 + this.UniformInt(faces);
            }
            return accumulator;
        };
        // TODO: Check name is correct.
        this.Bates = (min, max, n = 4) => {
            let accumulator = 0;
            for (let i = 0; i < n; i++) {
                accumulator += this.generator(); // Equiv. Uniform(0, 1).
            }
            return Interpolate(min, max, accumulator / n);
        };
        this.generator = generator || defaultGenerator;
    }
    /** Returns true with probability p (default 0.5). */
    Bernoulli(p = 0.5) {
        return this.generator() < p;
    }
    UniformInt(a, b) {
        if (b == undefined) {
            if (a == undefined) {
                // UniformInt() => Range [0, MAX_INT).
                return Math.floor(this.generator() * Number.MAX_SAFE_INTEGER);
            }
            else {
                // UniformInt(n) => Range [0, n).
                return Math.floor(this.generator() * a);
            }
        }
        else {
            if (a == undefined) {
                // UniformInt(undefined, b) => Bullshit.
                throw new Error('Bad arguments on UniformInt');
            }
            else {
                // UniformInt(min, max) => Range [min, max].
                return Math.floor(Interpolate(a, b + 1, this.generator()));
            }
        }
    }
    ;
    Uniform(a, b) {
        if (b == undefined) {
            if (a == undefined) {
                // Uniform() => Range [0, 1).
                return this.generator();
            }
            else {
                // Uniform(x) => Range [0, x).
                return this.generator() * a;
            }
        }
        else {
            if (a == undefined) {
                // Uniform(undefined, b) => Bullshit.
                throw new Error('Bad arguments on Uniform');
            }
            else {
                // Uniform(min, max) => Range [min, max).
                return Interpolate(a, b, this.generator());
            }
        }
    }
    ;
}
