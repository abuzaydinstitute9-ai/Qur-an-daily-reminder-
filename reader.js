/* ============================================================
   reader.js
   - Page navigation: prev/next buttons + jump-to-page (no more
     tap-anywhere-to-turn-page, since the page itself is now used
     for pointing at words)
   - Pointer: a small marker the reciter positions by dragging,
     clicking anywhere on the page, or nudging with the arrow
     buttons / arrow keys — word-by-word and line-by-line. It
     never moves on its own.
   - Audio playback per page + optional in-browser recording
   ============================================================ */

(function () {
  const WORD_STEP_PCT = 4;   // horizontal nudge per press, in % of page width
  const LINE_STEP_PCT = 100 / 15; // vertical nudge per press (~15 lines/page)

  const params = new URLSearchParams(window.location.search);
  let currentPage = clampPage(parseInt(params.get("page"), 10) || 1);

  // pointer position as percentages of the frame, top-left anchored
  let pointerX = 4;
  let pointerY = 6;

  const pageImg = document.getElementById("pageImg");
  const pageFallback = document.getElementById("pageFallback");
  const pageIndicator = document.getElementById("pageIndicator");
  const surahLabel = document.getElementById("currentSurahLabel");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const jumpInput = document.getElementById("jumpPageInput");
  const jumpBtn = document.getElementById("jumpPageBtn");
  const mushafFrame = document.getElementById("mushafFrame");
  const pointerOverlay = document.getElementById("pointerOverlay");
  const pointerMarker = document.getElementById("pointerMarker");
  const wordLeftBtn = document.getElementById("wordLeftBtn");
  const wordRightBtn = document.getElementById("wordRightBtn");
  const lineUpBtn = document.getElementById("lineUpBtn");
  const lineDownBtn = document.getElementById("lineDownBtn");
  const resetPointerBtn = document.getElementById("resetPointerBtn");
  const hidePointerToggle = document.getElementById("hidePointerToggle");

  const audioPlayer = document.getElementById("audioPlayer");
  const audioStatus = document.getElementById("audioStatus");
  const recordBtn = document.getElementById("recordBtn");
  const recordDot = document.getElementById("recordDot");
  const downloadRecordingLink = document.getElementById("downloadRecordingLink");

  function clampPage(p) {
    return Math.min(Math.max(p, 1), TOTAL_PAGES);
  }
  function pad3(n) {
    return String(n).padStart(3, "0");
  }
  function clampPct(v) {
    return Math.min(Math.max(v, 0), 100);
  }

  function loadPage(pageNum) {
    currentPage = clampPage(pageNum);

    pageIndicator.textContent = `Page ${currentPage} / ${TOTAL_PAGES}`;
    const surah = surahForPage(currentPage);
    surahLabel.textContent = `${surah.name} \u2014 ${surah.arabic}`;

    const src = `images/pages/page${pad3(currentPage)}.jpg`;
    pageImg.onerror = () => {
      pageImg.style.display = "none";
      pageFallback.style.display = "flex";
      pageFallback.querySelector("strong").textContent = `Page ${currentPage}`;
    };
    pageImg.onload = () => {
      pageImg.style.display = "block";
      pageFallback.style.display = "none";
    };
    pageImg.src = src;

    const audioSrc = `audio/page${pad3(currentPage)}.mp3`;
    audioPlayer.src = audioSrc;
    audioStatus.textContent = `Loaded audio/page${pad3(currentPage)}.mp3 (add this file to enable playback)`;

    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= TOTAL_PAGES;
    jumpInput.value = "";

    // moving to a new page resets the pointer to the top-right
    // start of the page (Arabic reads right-to-left, top line first)
    pointerX = 80;
    pointerY = 6;
    updatePointerPosition();
    history.replaceState(null, "", `?page=${currentPage}`);
  }

  function updatePointerPosition() {
    pointerX = clampPct(pointerX);
    pointerY = clampPct(pointerY);
    pointerMarker.style.left = `${pointerX}%`;
    pointerMarker.style.top = `${pointerY}%`;
  }

  // ---- page navigation (buttons + jump field only) ----
  prevPageBtn.addEventListener("click", () => loadPage(currentPage - 1));
  nextPageBtn.addEventListener("click", () => loadPage(currentPage + 1));
  jumpBtn.addEventListener("click", () => {
    const v = parseInt(jumpInput.value, 10);
    if (v) loadPage(v);
  });
  jumpInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") jumpBtn.click();
  });

  // ---- pointer: click anywhere on the page to place it there ----
  pointerOverlay.addEventListener("click", (e) => {
    if (e.target.closest(".pointer-marker")) return; // don't jump while grabbing it
    placeAtEvent(e);
  });

  function placeAtEvent(e) {
    const rect = mushafFrame.getBoundingClientRect();
    pointerX = ((e.clientX - rect.left) / rect.width) * 100;
    pointerY = ((e.clientY - rect.top) / rect.height) * 100;
    updatePointerPosition();
  }

  // ---- pointer: drag the marker itself (mouse + touch via Pointer Events) ----
  let dragging = false;
  pointerMarker.addEventListener("pointerdown", (e) => {
    dragging = true;
    pointerMarker.classList.add("dragging");
    pointerMarker.setPointerCapture(e.pointerId);
  });
  pointerMarker.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    placeAtEvent(e);
  });
  pointerMarker.addEventListener("pointerup", () => {
    dragging = false;
    pointerMarker.classList.remove("dragging");
  });

  // ---- pointer: nudge buttons (word left/right, line up/down) ----
  wordRightBtn.addEventListener("click", () => { pointerX -= WORD_STEP_PCT; updatePointerPosition(); }); // RTL: "next word" moves left
  wordLeftBtn.addEventListener("click", () => { pointerX += WORD_STEP_PCT; updatePointerPosition(); });
  lineDownBtn.addEventListener("click", () => { pointerY += LINE_STEP_PCT; updatePointerPosition(); });
  lineUpBtn.addEventListener("click", () => { pointerY -= LINE_STEP_PCT; updatePointerPosition(); });
  resetPointerBtn.addEventListener("click", () => { pointerX = 80; pointerY = 6; updatePointerPosition(); });
  hidePointerToggle.addEventListener("change", () => {
    pointerMarker.classList.toggle("hidden-marker", hidePointerToggle.checked);
  });

  // keyboard: arrow keys nudge the pointer word-by-word / line-by-line.
  // Page turning is buttons-only now, so arrow keys are free for this.
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowDown") { e.preventDefault(); lineDownBtn.click(); }
    if (e.key === "ArrowUp") { e.preventDefault(); lineUpBtn.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); wordRightBtn.click(); } // RTL
    if (e.key === "ArrowRight") { e.preventDefault(); wordLeftBtn.click(); }
  });

  // ---- recording (MediaRecorder) ----
  let mediaRecorder = null;
  let chunks = [];
  let isRecording = false;

  recordBtn.addEventListener("click", async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          downloadRecordingLink.href = url;
          downloadRecordingLink.download = `page${pad3(currentPage)}-recitation.webm`;
          downloadRecordingLink.style.display = "inline-flex";
          stream.getTracks().forEach((t) => t.stop());
        };
        mediaRecorder.start();
        isRecording = true;
        recordBtn.textContent = "Stop recording";
        recordDot.classList.add("live");
      } catch (err) {
        audioStatus.textContent = "Microphone access was blocked or unavailable in this browser.";
      }
    } else {
      mediaRecorder.stop();
      isRecording = false;
      recordBtn.textContent = "Record recitation";
      recordDot.classList.remove("live");
    }
  });

  loadPage(currentPage);
})();
