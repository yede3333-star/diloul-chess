/**
 * Stockfish 19 (npm "stockfish", full NNUE engine) for build scripts in Node.
 * analyse(fen, { depth, multiPv }) → lines sorted best first, scores in centipawns from the side to move.
 * Mate scores are mapped to ±(100000 - plies) so they sort correctly.
 */
import { createRequire } from "node:module";
import { availableParallelism } from "node:os";

const require = createRequire(import.meta.url);

export function createEngine({ flavor = "full", threads = Math.max(1, availableParallelism() - 1), hashMb = 256 } = {}) {
  let listener = () => {};
  // Emscripten treats process.argv as the engine's own command line: a script argument such as
  // "london" would be read as a UCI command and stop the engine. Hide them while it starts.
  const savedArgv = process.argv;
  process.argv = savedArgv.slice(0, 2);
  // It also replaces the global fetch with null and installs a file-based XMLHttpRequest;
  // keep the real ones for the rest of the script (the explorer client needs fetch).
  const savedFetch = globalThis.fetch;
  const savedXhr = globalThis.XMLHttpRequest;
  const engine = require("stockfish")(flavor, (line) => listener(String(line)));
  const send = (cmd) => engine.processCommand(cmd);

  const waitFor = (pred) =>
    new Promise((resolve) => {
      listener = (line) => {
        if (pred(line)) resolve(line);
      };
    });

  async function init() {
    const ok = waitFor((l) => l === "uciok");
    send("uci");
    await ok;
    send(`setoption name Threads value ${threads}`);
    send(`setoption name Hash value ${hashMb}`);
    const ready = waitFor((l) => l === "readyok");
    send("isready");
    await ready;
    process.argv = savedArgv;
    globalThis.fetch = savedFetch;
    if (savedXhr === undefined) delete globalThis.XMLHttpRequest;
    else globalThis.XMLHttpRequest = savedXhr;
  }

  /** @returns {Promise<{ uci: string, cp: number, mate: number|null, depth: number, pv: string[] }[]>} */
  async function analyse(fen, { depth = 20, multiPv = 1 } = {}) {
    send(`setoption name MultiPV value ${multiPv}`);
    send("ucinewgame");
    const lines = new Map();
    const done = new Promise((resolve) => {
      listener = (line) => {
        if (line.startsWith("info") && line.includes(" pv ") && line.includes(" score ")) {
          const d = Number(line.match(/ depth (\d+)/)?.[1]);
          const k = Number(line.match(/ multipv (\d+)/)?.[1] ?? 1);
          const mate = line.match(/ score mate (-?\d+)/);
          const cp = line.match(/ score cp (-?\d+)/);
          const pv = line.split(" pv ")[1].trim().split(/\s+/);
          const score = mate ? Math.sign(Number(mate[1])) * (100000 - Math.abs(Number(mate[1]))) : Number(cp[1]);
          if (!lines.has(k) || d >= lines.get(k).depth) lines.set(k, { uci: pv[0], cp: score, mate: mate ? Number(mate[1]) : null, depth: d, pv });
        } else if (line.startsWith("bestmove")) resolve();
      };
    });
    send(`position fen ${fen}`);
    send(`go depth ${depth}`);
    await done;
    return [...lines.values()].sort((a, b) => b.cp - a.cp);
  }

  return { init, analyse, quit: () => engine.terminate() };
}
