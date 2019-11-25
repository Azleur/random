# Pseudorandom number generator suite

**Definitely still a Work In Progress!**

This TypeScript module provides:

* an interface for [pseudorandom number generators (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator),
* an implementation of a [linear congruential generator (LCG)](https://en.wikipedia.org/wiki/Linear_congruential_generator),
* a wrapper around PRNGs to obtain common probability distributions.

## PRNG

```typescript
type rng = () => number
```

Functions marked as `rng` must return a value in the range `[0, 1)` and produce *pseudorandom numbers* (number sequences that look like true randomness).

```typescript
type RngCreator = (seed?: number) => rng
```

Functions marked as `RngCreator` are factories for `rng` functions. They are used to initialize and seed the `rng`.

## Implementations

`GetDefaultGenerator()` is an `RngCreator` that returns the environment's `Math.random()` generator.
Note that `Math.random()` cannot be seeded and its implementation can vary.

`GetLCG(seed?)` is an `RngCreator` that returns a seeded linear congruential generator.
It provides a random seed if none is supplied.

## RngProvider

The class `RngProvider` is a wrapper around an `rng` that provides the following distributions:

* `Bernoulli(p?)` [(coin toss)](https://en.wikipedia.org/wiki/Bernoulli_distribution) returns `true` with probability `p` (default 0.5) and `false` with probability `1-p`.
* `UniformInt()` [(random integer)](https://en.wikipedia.org/wiki/Discrete_uniform_distribution) returns any integer in a range with equal probability. It has the following variants:
    * `UniformInt()`: range `[0, MAX_SAFE_INTEGER)`.
    * `UniformInt(n)`: range `[0, n)` (`n` excluded).
    * `UniformInt(min, max)`: range `[min, max]` (`max` included).
* `Uniform()` [(random float)](https://en.wikipedia.org/wiki/Uniform_distribution_(continuous)) returns any number in a range with equal probability. It has the following variants:
    * `Uniform()`: range `[0, 1)`.
    * `Uniform(x)`: range `[0, x)`.
    * `Uniform(min, max)`: range `[min, max)`.
* `Dice(dice, faces)` [(rolling dice)](http://mathworld.wolfram.com/Dice.html) returns the result of rolling `dice` dice of `faces` faces each.
* `Bates(min, max, n?)` [(bounded bell)](https://en.wikipedia.org/wiki/Bates_distribution) uses a bell-shaped distribution that takes values in `[min, max]`. It is calculated by averaging `n` uniform distributions (default 4).
* `Pick(options)` returns a random element from an array, with equal probability. It preserves the original array.
* `Pop(options)` removes and returns a random element from an array, with equal probability.
* `PickWeighted(options, weights)` returns a random element from an array, with probability proportional to its weight. It preserves the original array.
* `Shuffle(values)` randomly shuffles an array in-place.

## Example

```typescript
const rng = GetLCG(92740287); // Same seed => same results.
const provider = new RngProvider(rng);
const also = new RngProvide(); // Defaults are provided.

const bernoulli: boolean = provider.Bernoulli(0.3); // 30% chance of true.
const n = provider.UniformInt(3, 5); // 3, 4 or 5.
const x = provider.Uniform(); // 0 <= x < 1.
const roll = provider.Dice(2, 6); // 2 and 12 very unlikely, 7 very likely.
const bell = provider.Bates(8, 10); // Probably close to 9.

const array = [0, 1, 2, 3];
const entry = provider.Pick(array); // 0, 1, 2, or 3.
const another = provider.Pop(array); // Now array is smaller.
provider.PickWeighted(['a', 'b', 'c'], [1, 1, 4.5]); // 'c' is more likely.
const another = [4, 5, 6];
provider.Shuffle(another); // Any re-ordering, e.g. [5, 4, 6].
```
