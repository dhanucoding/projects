# Unit Converter

Convert length, weight, temperature, and volume between common units.

## Features
- Tabbed categories: Length, Weight, Temperature, Volume
- Instant two-way conversion as you type into any field
- Common metric and imperial/US units per category (e.g. mm/cm/m/km/in/ft/yd/mi for length)

## How it works
Entirely client-side, no storage or network calls. Length, weight, and volume
use a shared base-unit factor per category (e.g. meters, kilograms, liters) —
typing in one field multiplies by its factor to get the base value, then
divides by every other unit's factor. Temperature uses hand-rolled
Celsius/Fahrenheit/Kelvin conversion formulas since it isn't a simple linear
scale factor.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-09-30 as part of the daily app-generation routine.
Idea source: [IDEAS.md](../IDEAS.md)
