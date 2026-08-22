/* ============================================================
   daily.js
   Draws the daily verse/hadith flashcard on a <canvas>.

   The verse or hadith is always rendered in FULL: this file
   measures the wrapped text first, then (in order) shrinks the
   font a little, then grows the canvas taller, until everything
   fits. It never truncates or adds an ellipsis.
   ============================================================ */

(function () {
  const canvas = document.getElementById("dailyCanvas");
  const ctx = canvas.getContext("2d");

  const arabicInput = document.getElementById("arabicText");
  const translationInput = document.getElementById("translationText");
  const refInput = document.getElementById("refText");
  const typeRadios = document.querySelectorAll('input[name="contentType"]');
  const phoneInput = document.getElementById("phoneText");
  const themeSelect = document.getElementById("themeSelect");

  const copyBtn = document.getElementById("copyBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const copyFeedback = document.getElementById("copyFeedback");

  const WIDTH = 1080;
  const MIN_HEIGHT = 1080;   // Instagram square
  const MAX_HEIGHT = 2200;   // hard ceiling so a very long hadith still renders, just taller
  const SIDE_MARGIN = 90;
  const TOP_BLOCK = 260;     // space above the arabic text (tag + padding)
  const BOTTOM_BLOCK = 260;  // space reserved for ref + brand footer

  const FONT_STEPS = [
    { arabic: 48, translation: 32, lineHeightMul: 1.0 },
    { arabic: 42, translation: 29, lineHeightMul: 0.96 },
    { arabic: 36, translation: 26, lineHeightMul: 0.92 },
    { arabic: 30, translation: 23, lineHeightMul: 0.9  },
    { arabic: 26, translation: 20, lineHeightMul: 0.88 },
  ];

  const THEMES = {
    green: { bg1: "#0B4D34", bg2: "#0F7A4F", text: "#FFFFFF", accent: "#BFE6D2" },
    white: { bg1: "#FFFFFF", bg2: "#F5FBF7", text: "#0B4D34", accent: "#0F7A4F" },
  };

  canvas.width = WIDTH;
  canvas.height = MIN_HEIGHT;

  function measureWrap(text, font, maxWidth) {
    ctx.font = font;
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawWrappedLines(lines, x, startY, lineHeight) {
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  }

  // Find a font-size step + canvas height that fits the FULL text —
  // never shortens the content itself.
  function computeLayout(arabic, translation) {
    const maxWidth = WIDTH - SIDE_MARGIN * 2;

    for (const step of FONT_STEPS) {
      const arabicLineH = step.arabic * 1.5;
      const translationLineH = step.translation * 1.35;

      const arabicLines = measureWrap(arabic, `${step.arabic}px 'Amiri Quran', serif`, maxWidth);
      const translationLines = measureWrap(translation, `italic ${step.translation}px 'Cormorant Garamond', serif`, maxWidth);

      const contentHeight =
        arabicLines.length * arabicLineH +
        40 + // gap between arabic and translation
        translationLines.length * translationLineH;

      const neededHeight = TOP_BLOCK + contentHeight + BOTTOM_BLOCK;

      if (neededHeight <= MAX_HEIGHT) {
        return {
          step,
          arabicLines,
          translationLines,
          arabicLineH,
          translationLineH,
          canvasHeight: Math.max(MIN_HEIGHT, Math.ceil(neededHeight)),
        };
      }
    }

    // even the smallest font overflows MAX_HEIGHT — fall back to the
    // smallest font and let the canvas grow to MAX_HEIGHT; the text
    // is still drawn in full, just tightly packed.
    const step = FONT_STEPS[FONT_STEPS.length - 1];
    const arabicLineH = step.arabic * 1.4;
    const translationLineH = step.translation * 1.25;
    const arabicLines = measureWrap(arabic, `${step.arabic}px 'Amiri Quran', serif`, maxWidth);
    const translationLines = measureWrap(translation, `italic ${step.translation}px 'Cormorant Garamond', serif`, maxWidth);
    return {
      step, arabicLines, translationLines, arabicLineH, translationLineH,
      canvasHeight: MAX_HEIGHT,
    };
  }

  function draw() {
    const theme = THEMES[themeSelect.value] || THEMES.green;
    const type = document.querySelector('input[name="contentType"]:checked').value;
    const arabic = arabicInput.value.trim();
    const translation = translationInput.value.trim();
    const ref = refInput.value.trim();
    const phone = phoneInput.value.trim();

    const layout = computeLayout(arabic || " ", translation || " ");
    canvas.height = layout.canvasHeight;

    // background
    const grad = ctx.createLinearGradient(0, 0, WIDTH, canvas.height);
    grad.addColorStop(0, theme.bg1);
    grad.addColorStop(1, theme.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, canvas.height);

    // decorative rings (signature element)
    ctx.strokeStyle = theme.text === "#FFFFFF" ? "rgba(255,255,255,0.15)" : "rgba(11,77,52,0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(WIDTH - 90, canvas.height - 90, 160, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(90, 90, 90, 0, Math.PI * 2);
    ctx.stroke();

    // eyebrow tag
    ctx.textAlign = "center";
    ctx.fillStyle = theme.accent;
    ctx.font = "600 26px Inter, sans-serif";
    ctx.fillText(type === "hadith" ? "HADITH OF THE DAY" : "VERSE OF THE DAY", WIDTH / 2, 130);

    // Arabic block — drawn in full, never truncated
    ctx.fillStyle = theme.text;
    ctx.font = `${layout.step.arabic}px 'Amiri Quran', serif`;
    ctx.direction = "rtl";
    let y = TOP_BLOCK;
    drawWrappedLines(layout.arabicLines, WIDTH / 2, y, layout.arabicLineH);
    y += layout.arabicLines.length * layout.arabicLineH + 40;

    // translation block — also drawn in full
    ctx.direction = "ltr";
    ctx.font = `italic ${layout.step.translation}px 'Cormorant Garamond', serif`;
    drawWrappedLines(layout.translationLines, WIDTH / 2, y, layout.translationLineH);

    // reference + brand footer, anchored to the bottom of the (now
    // correctly sized) canvas
    ctx.font = "500 22px Inter, sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.fillText(ref || "", WIDTH / 2, canvas.height - 190);

    ctx.font = "700 30px 'Cormorant Garamond', serif";
    ctx.fillStyle = theme.text;
    ctx.fillText("Abu Zayd Institute", WIDTH / 2, canvas.height - 120);

    ctx.font = "400 22px Inter, sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.fillText(phone || "", WIDTH / 2, canvas.height - 84);

    ctx.font = "400 16px Inter, sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.fillText("Powered by Abu Zayd Solutions \u00B7 2026", WIDTH / 2, canvas.height - 40);
  }

  function copyCardText() {
    // Always the full Arabic text and the full translation — no
    // shortening, matching what is drawn on the card.
    const parts = [
      arabicInput.value.trim(),
      translationInput.value.trim(),
      refInput.value.trim(),
      "",
      "Abu Zayd Institute" + (phoneInput.value.trim() ? " \u2014 " + phoneInput.value.trim() : ""),
    ].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n")).then(() => {
      copyFeedback.textContent = "Copied in full to clipboard.";
      setTimeout(() => (copyFeedback.textContent = ""), 2500);
    }).catch(() => {
      copyFeedback.textContent = "Could not copy — select and copy the text manually.";
    });
  }

  function downloadCard() {
    const link = document.createElement("a");
    link.download = "abuzayd-daily-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  [arabicInput, translationInput, refInput, phoneInput].forEach((el) =>
    el.addEventListener("input", draw)
  );
  typeRadios.forEach((r) => r.addEventListener("change", draw));
  themeSelect.addEventListener("change", draw);
  copyBtn.addEventListener("click", copyCardText);
  downloadBtn.addEventListener("click", downloadCard);

  // wait for the Arabic web font to be ready so measurement and the
  // first paint both use the real font metrics
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }
  draw();
})();
