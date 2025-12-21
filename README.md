# Alchemy Factory Calculator

Hi! This is a simple, browser-based calculator I built for the game **Alchemy Factory**.

I created this primarily as a personal project to solve the math problems I was running into while playing (e.g., figuring out exactly how many Crucibles I need to feed my main production line, or how much fertilizer my herb farm actually consumes). It was also a fun experiment to see how much of the coding I could do using AI assistance (specifically Google Gemini).

You can use the live version here:
**[Launch Planner](https://joejoesgit.github.io/AlchemyFactoryCalculator/)**

### Is this tool complete?
Nope!

### Is it perfect?
Nope!

### Is it always accurate?
Nope!

But it is **directionally correct**, and I've found it super helpful for planning out my factory layouts without having to constantly tear things down. I will likely update it as I notice issues or unlock new tiers in the game, for however long doing so interests me.

Feel free to fork the code and make versions of this for yourself!

---

## Features

* **Production Calculator:** Select any item (Potions, Relics, Alloys) and see exactly what machines and raw materials you need.
* **Integrated Loops:** Automatically calculates "Self-Feeding" loops (e.g., burning Charcoal to make Charcoal) and "Self-Fertilizing" loops.
* **Net Math:** Accounts for the energy/nutrients consumed by the production chain itself, so you don't under-build your support infrastructure.
* **Tiered Upgrades:** Input your current research levels (Belt Speed, Factory Efficiency, etc.) to get accurate rates.
* **Persistent Saves:** Your settings and upgrade levels are saved to your browser's local storage, so you don't have to re-enter them every time.
* **Database Editor:** Includes a built-in JSON editor if you want to manually tweak recipe values or machine speeds yourself.

## How to Run Locally

If you don't want to use the web version, you can run this on your own computer:

1.  Download the files (`index.html` and `alchemy_db.js`).
2.  Keep them in the same folder.
3.  Double-click `index.html` to open it in your browser.

That's it! No servers or installation required.
