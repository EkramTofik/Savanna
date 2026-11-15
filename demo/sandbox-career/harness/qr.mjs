/** Tiny QR Version 4-L encoder (byte mode). Enough for localhost verify URLs. */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}

function rs(data, ecCount) {
  const gen = new Uint8Array(ecCount);
  gen[ecCount - 1] = 1;
  let root = 1;
  for (let i = 0; i < ecCount; i += 1) {
    for (let j = 0; j < ecCount; j += 1) {
      gen[j] = xorMul(gen[j], root, j + 1 < ecCount ? gen[j + 1] : 0);
    }
    root = EXP[LOG[root] + 1];
  }
  const result = new Uint8Array(ecCount);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.copyWithin(0, 1);
    result[ecCount - 1] = 0;
    if (!factor) continue;
    const logFactor = LOG[factor];
    for (let j = 0; j < ecCount; j += 1) {
      result[j] ^= EXP[(LOG[gen[j]] + logFactor) % 255];
    }
  }
  return result;
}

function xorMul(a, root, b) {
  if (a === 0) return b;
  return EXP[LOG[a] + LOG[root]] ^ b;
}

function bits() {
  const buf = [];
  let acc = 0;
  let n = 0;
  return {
    push(value, width) {
      for (let i = width - 1; i >= 0; i -= 1) {
        acc = (acc << 1) | ((value >> i) & 1);
        n += 1;
        if (n === 8) {
          buf.push(acc);
          acc = 0;
          n = 0;
        }
      }
    },
    bytes(len) {
      if (n) buf.push(acc << (8 - n));
      while (buf.length < len) {
        buf.push(buf.length % 2 === 0 ? 0xec : 0x11);
      }
      return Uint8Array.from(buf.slice(0, len));
    },
  };
}

export function qrSvg(text, size = 160) {
  const dim = 33;
  const dataLen = 80;
  const ecLen = 20;
  const stream = bits();
  const bytes = Buffer.from(text, "utf8");
  stream.push(0b0100, 4);
  stream.push(bytes.length, 8);
  for (const b of bytes) stream.push(b, 8);
  stream.push(0, 4);
  const data = stream.bytes(dataLen);
  const ecc = rs(data, ecLen);
  const code = new Uint8Array(dataLen + ecLen);
  code.set(data);
  code.set(ecc, dataLen);

  const m = Array.from({ length: dim }, () => Array(dim).fill(null));
  const setFinder = (r, c) => {
    for (let y = -1; y < 8; y += 1) {
      for (let x = -1; x < 8; x += 1) {
        const rr = r + y;
        const cc = c + x;
        if (rr < 0 || cc < 0 || rr >= dim || cc >= dim) continue;
        const on =
          x === -1 || y === -1 || x === 7 || y === 7
            ? false
            : x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
        if (x >= 0 && x <= 6 && y >= 0 && y <= 6)
          m[rr][cc] =
            x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
        else if (x === -1 || y === -1 || x === 7 || y === 7) m[rr][cc] = false;
        void on;
      }
    }
  };
  const paintFinder = (r, c) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        m[r + y][c + x] =
          x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
      }
    }
    for (let i = -1; i < 8; i += 1) {
      if (r - 1 >= 0 && c + i >= 0 && c + i < dim) m[r - 1][c + i] = false;
      if (r + 7 < dim && c + i >= 0 && c + i < dim) m[r + 7][c + i] = false;
      if (c - 1 >= 0 && r + i >= 0 && r + i < dim) m[r + i][c - 1] = false;
      if (c + 7 < dim && r + i >= 0 && r + i < dim) m[r + i][c + 7] = false;
    }
  };
  paintFinder(0, 0);
  paintFinder(0, dim - 7);
  paintFinder(dim - 7, 0);
  for (let i = 8; i < dim - 8; i += 1) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }
  const align = (r, c) => {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        m[r + y][c + x] = Math.max(Math.abs(x), Math.abs(y)) !== 1;
      }
    }
  };
  align(26, 26);
  m[dim - 8][8] = true;

  let bit = 0;
  const totalBits = code.length * 8;
  const next = () => {
    if (bit >= totalBits) return 0;
    const v = (code[bit >> 3] >> (7 - (bit & 7))) & 1;
    bit += 1;
    return v;
  };
  let dir = -1;
  for (let col = dim - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let i = 0; i < dim; i += 1) {
      const row = dir < 0 ? dim - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (m[row][c] !== null) continue;
        const v = next();
        const mask = (row + c) % 2 === 0;
        m[row][c] = mask ? v ^ 1 : v;
      }
    }
    dir *= -1;
  }

  const format = 0b111011111000100; // mask 0, EC L, already BCH encoded (common table)
  const formatBits = [];
  for (let i = 14; i >= 0; i -= 1) formatBits.push((format >> i) & 1);
  const putFmt = (r, c, i) => {
    m[r][c] = formatBits[i] === 1;
  };
  const fmtMap = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
  fmtMap.forEach(([r, c], i) => putFmt(r, c, i));
  const fmtMap2 = [
    [dim - 1, 8],
    [dim - 2, 8],
    [dim - 3, 8],
    [dim - 4, 8],
    [dim - 5, 8],
    [dim - 6, 8],
    [dim - 7, 8],
    [8, dim - 8],
    [8, dim - 7],
    [8, dim - 6],
    [8, dim - 5],
    [8, dim - 4],
    [8, dim - 3],
    [8, dim - 2],
    [8, dim - 1],
  ];
  fmtMap2.forEach(([r, c], i) => putFmt(r, c, i));

  const cell = size / (dim + 8);
  let rects = "";
  for (let y = 0; y < dim; y += 1) {
    for (let x = 0; x < dim; x += 1) {
      if (m[y][x]) {
        rects += `<rect x="${((x + 4) * cell).toFixed(2)}" y="${((y + 4) * cell).toFixed(2)}" width="${cell + 0.05}" height="${cell + 0.05}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="የፈጣን ምላሽ ኮድ፤ የማረጋገጫ አገናኝ ${escapeXml(text)}">${rects}</svg>`;
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}
