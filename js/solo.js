/* =====================================================================
   solo.js — "Play solo" mode: 3 games + progress / streak
   ===================================================================== */

window.CAA = window.CAA || {};

CAA.solo = (function () {
  const U = () => CAA.util;
  const C = () => CAA.content;
  const ROUND = 10; // questions per round
  const ANA_TIME = 60;     // solo anagram : durée de la manche (s)
  const ANA_PENALTY = 5;   // secondes perdues par mauvaise réponse
  const ANA_MAX_PASS = 3;  // nombre de « pass » autorisés

  /* ---------- Header avec HUD & Level Badge ---------- */
  function header(scr, title, currentIdx, score, levelTier) {
    const h = U().h;
    const tierObj = {
      easy: { label: "🌱 Easy", cls: "easy" },
      medium: { label: "⚡ Medium", cls: "medium" },
      hard: { label: "🔥 Hard", cls: "hard" },
      all: { label: "🎯 All Levels", cls: "all" }
    }[levelTier || "all"] || { label: "🎯 All Levels", cls: "all" };

    const hud = h("div", { class: "solo-score-hud" }, [
      h("div", { class: "row", style: "gap:10px;align-items:center;" }, [
        h("span", { style: "font-weight:900;" }, [title]),
        h("span", { class: "level-badge " + tierObj.cls }, [tierObj.label])
      ]),
      h("div", { class: "row", style: "gap:14px;align-items:center;" }, [
        h("span", {}, ["Question: ", h("b", {}, [String(currentIdx + 1), " / ", String(ROUND)])]),
        h("span", {}, ["Score: ", h("b", { class: "pts" }, [String(score), " pts"])])
      ])
    ]);
    scr.appendChild(hud);
  }

  /* ---------- Level Selection Component ---------- */
  function renderLevelSelector(title, icon, subtitle, onSelectTier) {
    U().show((scr) => {
      const h = U().h;
      scr.appendChild(h("h2", { class: "section-title" }, [icon + " " + title]));
      scr.appendChild(h("p", { class: "section-sub" }, [subtitle || "Choose your level difficulty:"]));

      const tiers = [
        { id: "easy", ic: "🌱", label: "Easy (Débutant)", sub: "Mots simples & indices courts" },
        { id: "medium", ic: "⚡", label: "Medium (Intermédiaire)", sub: "Vocabulaire courant" },
        { id: "hard", ic: "🔥", label: "Hard (Avancé)", sub: "Vocabulaire élaboré & défis complexes" },
        { id: "all", ic: "🎯", label: "All Levels (Tous Niveaux)", sub: "Mélange équilibré de tous les niveaux" }
      ];

      const grid = h("div", { class: "choice-grid mt" });
      tiers.forEach((t) => {
        grid.appendChild(h("div", {
          class: "choice",
          onclick: () => onSelectTier(t.id)
        }, [
          h("div", { class: "ic" }, [t.ic]),
          h("h4", {}, [t.label]),
          h("small", {}, [t.sub])
        ]));
      });
      scr.appendChild(grid);

      scr.appendChild(h("div", { class: "row center mt-lg" }, [
        h("button", { class: "btn btn-ghost", onclick: menu }, ["Back to Solo Menu"])
      ]));
    });
  }

  /* ---------- Solo menu ---------- */
  function menu() {
    U().show((scr) => {
      const h = U().h;
      const streak = U().store.get("streak", 0);
      const learned = U().store.get("learned", 0);

      scr.appendChild(h("h2", { class: "section-title" }, ["🎯 Play solo"]));
      scr.appendChild(h("p", { class: "section-sub" }, [
        "Practise at your own pace with level design & SQLite dictionary word validation."
      ]));

      scr.appendChild(h("div", { class: "hud" }, [
        h("span", {}, ["🔥 Streak: ", h("b", { class: "badge-streak" }, [String(streak), " day(s)"])]),
        h("span", {}, ["📚 Words seen: ", h("b", {}, [String(learned)])])
      ]));

      const games = [
        { id: "match", ic: "🧩", t: "Word Match", s: "Match the picture to the word by level" },
        { id: "spelling", ic: "🐝", t: "Spelling Bee", s: "Listen & type exact spelling (sqlite check)" },
        { id: "alphabet", ic: "🔠", t: "Alphabet Race", s: "Race A to Z against the clock" },
        { id: "pronounce", ic: "🗣️", t: "Pronunciation Drill", s: "Tricky words, IPA & tips by tier" },
        { id: "fill",  ic: "✍️", t: "Fill in the Blank", s: "Grammar challenge by level" },
        { id: "irregular", ic: "🔁", t: "Irregular Verbs", s: "Past simple, participle or meaning" },
        { id: "phrasal", ic: "🔗", t: "Phrasal Verbs", s: "Verb meanings in FR or EN" },
        { id: "anagram", ic: "🔤", t: "Anagram", s: "Unscramble letters against clock" },
        { id: "mystery", ic: "🔍", t: "Mystery Object", s: "Solo object guessing with clues & audio" }
      ];
      const grid = h("div", { class: "choice-grid mt" });
      games.forEach((g) => {
        grid.appendChild(h("div", { class: "choice", onclick: () => start(g.id) }, [
          h("div", { class: "ic" }, [g.ic]),
          h("h4", {}, [g.t]),
          h("small", {}, [g.s])
        ]));
      });
      scr.appendChild(grid);
    });
  }

  function start(id) {
    if (id === "match") wordMatch();
    else if (id === "spelling") spellingBee();
    else if (id === "alphabet") alphabetRace();
    else if (id === "pronounce") pronunciationDrill();
    else if (id === "fill") fillBlank();
    else if (id === "irregular") irregularVerbs();
    else if (id === "phrasal") phrasalVerbs();
    else if (id === "anagram") anagram();
    else if (id === "mystery") mysteryObject();
  }

  /* ---------- Progress (daily streak + counter) ---------- */
  function markProgress(correctCount) {
    const learned = U().store.get("learned", 0) + correctCount;
    U().store.set("learned", learned);
    const today = new Date().toISOString().slice(0, 10);
    const last = U().store.get("lastPlay", null);
    let streak = U().store.get("streak", 0);
    if (last !== today) {
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      streak = last === yesterday ? streak + 1 : 1;
      U().store.set("streak", streak);
      U().store.set("lastPlay", today);
    }
  }

  /* ---------- End-of-round screen ---------- */
  function roundEnd(title, score, total, again) {
    markProgress(score);
    U().sfx.win();
    U().confetti(1800);
    U().show((scr) => {
      const h = U().h;
      const pct = Math.round((score / Math.max(1, total)) * 100);
      scr.appendChild(h("div", { class: "play-card solo-play-card" }, [
        h("div", { class: "prompt-emoji" }, [pct >= 80 ? "🌟" : pct >= 50 ? "👍" : "💪"]),
        h("h2", { class: "section-title" }, ["Round complete!"]),
        h("p", { class: "section-sub" }, [title]),
        h("div", { class: "prompt-word" }, [`${score} / ${total}`]),
        h("div", { class: "row center mt-lg" }, [
          h("button", { class: "btn btn-primary", onclick: again }, ["Play again"]),
          h("button", { class: "btn btn-ghost", onclick: menu }, ["Other games"])
        ])
      ]));
    }, { replace: true });
  }

  /* =================================================================
     GAME 1 — Word Match
     Show a picture (emoji) and choose the matching English word.
     ================================================================= */
  function wordMatch() {
    renderLevelSelector("Word Match", "🧩", "Choose your difficulty level for image matching:", (tier) => startWordMatch(tier));
  }

  function startWordMatch(tier) {
    let vocab = C().vocabulary || [];
    if (tier && tier !== "all") {
      const filtered = vocab.filter((v) => {
        const len = (v.en || "").length;
        if (tier === "easy") return len <= 5 || (v.level || "easy") === "easy";
        if (tier === "medium") return (len > 5 && len <= 7) || (v.level || "medium") === "medium";
        if (tier === "hard") return len >= 7 || (v.level || "hard") === "hard";
        return true;
      });
      if (filtered.length >= 4) vocab = filtered;
    }

    const deck = U().newSessionDeck(vocab, "solo_wordMatch_" + tier);
    const pool = deck.draw(Math.min(ROUND, vocab.length)) || [];
    if (!pool.length) {
      U().alertBox("No vocabulary words available for this tier!");
      return;
    }
    let i = 0, score = 0;

    function question() {
      const item = pool[i];
      if (!item) {
        roundEnd("Word Match", score, i, () => startWordMatch(tier));
        return;
      }
      const distractors = U().pickDistractors(vocab, item, 3, (w) => w.en);
      const options = U().shuffle([item].concat(distractors));

      U().show((scr) => {
        const h = U().h;
        header(scr, "🧩 Word Match", i, score, tier);
        const card = h("div", { class: "play-card solo-play-card" });
        card.appendChild(h("div", { class: "prompt-emoji" }, [item.emoji || "❓"]));
        card.appendChild(h("p", { class: "section-sub" }, ["Which English word matches this image?"]));

        const optWrap = h("div", { class: "options" });
        const buttons = [];
        options.forEach((o) => {
          const b = h("button", { class: "opt", onclick: () => choose(o, b) }, [o.en]);
          buttons.push(b);
          optWrap.appendChild(b);
        });
        card.appendChild(optWrap);
        const fb = h("div", { class: "feedback" });
        card.appendChild(fb);
        scr.appendChild(card);

        function choose(chosen, btn) {
          buttons.forEach((b) => (b.disabled = true));
          if (chosen.en === item.en) {
            btn.classList.add("correct");
            U().sfx.correct();
            fb.className = "feedback ok";
            fb.textContent = "Well done! ✅ " + item.en + (item.fr ? " = " + item.fr : "");
            score++;
          } else {
            btn.classList.add("wrong");
            U().sfx.wrong();
            const correctBtn = buttons.find((b) => b.textContent === item.en);
            if (correctBtn) correctBtn.classList.add("correct");
            fb.className = "feedback no";
            fb.textContent = `The answer: ${item.emoji || ""} ${item.en} (${item.fr || ""})`;
          }
          U().speak(item.en);
          setTimeout(next, 1400);
        }
      }, { replace: i > 0 });
    }

    function next() {
      i++;
      if (i < pool.length) question();
      else roundEnd("Word Match", score, pool.length, () => startWordMatch(tier));
    }
    question();
  }

  /* =================================================================
     GAME 1b — Spelling Bee (solo with sqlite validation check)
     Audio-first listening & spelling exercise (no image shown).
     ================================================================= */
  function spellingBee() {
    renderLevelSelector("Spelling Bee", "🐝", "Choose your spelling difficulty tier:", (tier) => startSpellingBee(tier));
  }

  function startSpellingBee(tier) {
    const vocabPool = (C().vocabulary || []).map(v => ({ word: v.en, tier: v.level || ((v.en || "").length <= 5 ? "easy" : (v.en || "").length <= 7 ? "medium" : "hard") }));
    const spellingPool = (C().spellingWords || []).map(w => typeof w === 'string' ? { word: w, tier: w.length <= 5 ? "easy" : w.length <= 7 ? "medium" : "hard" } : w);
    let fullPool = U().uniqueById(vocabPool.concat(spellingPool));

    if (tier && tier !== "all") {
      const filtered = fullPool.filter((w) => (w.tier || "medium") === tier);
      if (filtered.length >= 4) fullPool = filtered;
    }

    const deck = U().newSessionDeck(fullPool, "solo_spelling_" + tier);
    const pool = deck.draw(Math.min(ROUND, fullPool.length)) || [];
    if (!pool.length) {
      U().alertBox("No spelling words available for this tier!");
      return;
    }
    let i = 0, score = 0;

    function question() {
      const item = pool[i];
      if (!item) {
        roundEnd("Spelling Bee", score, i, () => startSpellingBee(tier));
        return;
      }
      const target = (typeof item === 'string' ? item : (item.word || item.en || "")).trim();

      U().show((scr) => {
        const h = U().h;
        header(scr, "🐝 Spelling Bee", i, score, tier);
        const card = h("div", { class: "play-card solo-play-card" });

        const audioHeader = h("div", { class: "center mb" });
        audioHeader.appendChild(h("div", { class: "prompt-emoji" }, ["🎧"]));
        audioHeader.appendChild(h("p", { class: "section-sub" }, ["Listen carefully and spell the word!"]));
        card.appendChild(audioHeader);

        const soundWrap = h("div", { class: "row center mt mb" });
        soundWrap.appendChild(h("button", {
          class: "btn btn-primary",
          style: "font-size:1.15rem;padding:10px 20px;",
          onclick: () => U().speak(target)
        }, ["🔊 Listen"]));

        soundWrap.appendChild(h("button", {
          class: "btn btn-ghost",
          style: "font-size:1.05rem;padding:10px 18px;",
          onclick: () => U().speak(target, { slow: true })
        }, ["🐢 Listen slowly"]));
        card.appendChild(soundWrap);

        const input = h("input", {
          type: "text",
          class: "input-text mt",
          placeholder: "Type what you hear...",
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          spellcheck: "false",
          style: "font-size:1.25rem;text-align:center;max-width:340px;margin:14px auto;display:block;"
        });

        const checkBtn = h("button", {
          class: "btn btn-green mt",
          onclick: () => submit()
        }, ["Check spelling ✓"]);

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submit();
        });

        card.appendChild(input);
        card.appendChild(checkBtn);

        const fb = h("div", { class: "feedback mt" });
        card.appendChild(fb);
        scr.appendChild(card);

        setTimeout(() => U().speak(target), 300);
        setTimeout(() => { try { input.focus(); } catch (e) {} }, 100);

        let answered = false;
        async function submit() {
          if (answered) return;
          const userVal = (input.value || "").trim();
          if (!userVal) return;
          answered = true;
          input.disabled = true;
          checkBtn.disabled = true;

          const isMatch = userVal.toLowerCase() === target.toLowerCase();
          const isValidSqlite = await U().validateEnglishWord(userVal);

          if (isMatch) {
            U().sfx.correct();
            fb.className = "feedback ok";
            fb.textContent = `Correct! ✅ ${target}`;
            score++;
          } else {
            U().sfx.wrong();
            fb.className = "feedback no";
            fb.textContent = `❌ You wrote "${userVal}" ${isValidSqlite ? '(valid word)' : ''} — correct spelling: "${target}"`;
          }
          U().speak(target);
          setTimeout(next, 1800);
        }
      }, { replace: i > 0 });
    }

    function next() {
      i++;
      if (i < pool.length) question();
      else roundEnd("Spelling Bee", score, pool.length, () => startSpellingBee(tier));
    }
    question();
  }

  /* =================================================================
     GAME — Pronunciation Drill
     Show a tricky word + IPA + tip. Player says it, then compares
     with the model audio and self-judges (optional mic check).
     ================================================================= */
  function pronunciationDrill() {
    const all = U().uniqueById(C().pronunciationWords || []);
    if (!all.length) {
      U().alertBox("No pronunciation words found. Add some in content.js.");
      return;
    }

    U().show((scr) => {
      const h = U().h;
      scr.appendChild(h("h2", { class: "section-title" }, ["🗣️ Pronunciation Drill"]));
      scr.appendChild(h("p", { class: "section-sub" }, [
        "Tricky English words: silent letters, TH, stress, -ough… Say the word, then listen to the model and judge yourself."
      ]));

      const tiers = [
        { id: "all", label: "All levels", sub: all.length + " words" },
        { id: "easy", label: "Easy", sub: "Warm-up traps" },
        { id: "medium", label: "Medium", sub: "Common pitfalls" },
        { id: "hard", label: "Hard", sub: "Advanced & tricky" }
      ];
      const grid = h("div", { class: "choice-grid mt" });
      tiers.forEach((t) => {
        grid.appendChild(h("div", { class: "choice", onclick: () => startPronounceRound(t.id) }, [
          h("div", { class: "ic" }, [t.id === "hard" ? "🔥" : t.id === "medium" ? "⚡" : t.id === "easy" ? "🌱" : "🎯"]),
          h("h4", {}, [t.label]),
          h("small", {}, [t.sub])
        ]));
      });
      scr.appendChild(grid);
    });
  }

  function startPronounceRound(tier) {
    let pool = U().uniqueById(C().pronunciationWords || []);
    if (tier && tier !== "all") {
      const filtered = pool.filter((w) => (w.tier || "medium") === tier);
      if (filtered.length >= 3) pool = filtered;
    }
    const deck = U().newSessionDeck(pool, "solo_pronounce_" + (tier || "all"));
    const items = deck.draw(Math.min(ROUND, pool.length));
    let i = 0, score = 0;
    const canListen = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    function question() {
      const item = items[i];
      let isVerified = false;

      U().show((scr) => {
        const h = U().h;
        header(scr, "🗣️ Pronunciation", i, score);

        const card = h("div", { class: "play-card pronounce-card" });
        card.appendChild(h("div", { class: "pron-trap" }, [item.trap || "pronunciation"]));
        card.appendChild(h("div", { class: "prompt-word pron-word" }, [item.word]));

        // Zone d'instruction / état
        const status = h("div", { class: "pron-status" }, [
          "1) Say the word out loud  ·  2) Tap 'Verify' to see IPA & hear model"
        ]);
        card.appendChild(status);

        // Zone cachée initialement — révélée lors de la vérification
        const revealedBox = h("div", { class: "pron-revealed-box", style: "display:none; width:100%;" });

        const ipaEl = h("div", { class: "pron-ipa mt-sm" }, [item.ipa || ""]);
        revealedBox.appendChild(ipaEl);

        if (item.fr) {
          revealedBox.appendChild(h("p", { class: "pron-fr" }, ["🇫🇷 " + item.fr]));
        }
        if (item.tip) {
          revealedBox.appendChild(h("div", { class: "pron-tip" }, [
            h("strong", {}, ["Tip: "]),
            item.tip
          ]));
        }
        if (item.focus) {
          revealedBox.appendChild(h("p", { class: "pron-focus" }, [item.focus]));
        }

        // Boutons audio modèle
        const hearBtn = h("button", {
          class: "btn btn-ghost",
          onclick: () => {
            U().speak(item.word);
            status.textContent = "🔊 Model pronunciation — compare with what you said.";
            status.className = "pron-status hear";
          }
        }, ["🔊 Hear model"]);

        const slowBtn = h("button", {
          class: "btn btn-ghost",
          onclick: () => {
            U().speak(item.word, { slow: true });
            status.textContent = "🐢 Slow model — listen carefully to each sound.";
            status.className = "pron-status hear";
          }
        }, ["🐢 Hear slowly"]);

        revealedBox.appendChild(h("div", { class: "row center mt-sm" }, [hearBtn, slowBtn]));

        // Boutons d'auto-évaluation
        const judge = h("div", { class: "pron-judge mt" });
        judge.appendChild(h("p", { class: "section-sub", style: "margin-bottom:10px" }, [
          "After comparing with the model, how did you do?"
        ]));
        judge.appendChild(h("div", { class: "row center" }, [
          h("button", { class: "btn btn-green", onclick: () => grade(true) }, ["✅ Sounded good"]),
          h("button", { class: "btn btn-ghost", onclick: () => retry() }, ["🔁 Practice again"]),
          h("button", { class: "btn btn-red", onclick: () => grade(false) }, ["😅 Need work"])
        ]));
        revealedBox.appendChild(judge);
        card.appendChild(revealedBox);

        // Boutons d'action initiaux (Vérifier / Micro)
        const verifyBtn = h("button", {
          class: "btn btn-primary",
          onclick: () => verifyPronunciation()
        }, ["🔍 Verify pronunciation & Hear model"]);

        const micBtn = h("button", {
          class: "btn btn-ghost",
          onclick: () => startMic()
        }, [canListen ? "🎤 Speak into mic" : "🎤 I pronounced it"]);

        const initialActions = h("div", { class: "row center mt-md" }, [verifyBtn, micBtn]);
        card.appendChild(initialActions);

        scr.appendChild(card);

        function verifyPronunciation(fromMicTranscript) {
          if (isVerified) {
            U().speak(item.word);
            return;
          }
          isVerified = true;
          initialActions.style.display = "none";
          revealedBox.style.display = "block";

          if (fromMicTranscript) {
            const match = U().pronunciationMatch(fromMicTranscript, item.word);
            if (match) {
              status.textContent = "Heard: “" + fromMicTranscript + "” — Great job! Listen to the model to refine.";
              status.className = "pron-status ok";
              U().sfx.correct();
            } else {
              status.textContent = "Heard: “" + fromMicTranscript + "” — Compare with the written IPA & model below.";
              status.className = "pron-status no";
              U().sfx.tick();
            }
          } else {
            status.textContent = "🔊 Model pronunciation written & played below. Compare yours!";
            status.className = "pron-status hear";
            U().sfx.tick();
          }

          // Déclencher la prononciation orale automatiquement lors de la vérification
          U().speak(item.word);
        }

        function startMic() {
          if (!canListen) {
            verifyPronunciation();
            return;
          }
          micBtn.disabled = true;
          micBtn.textContent = "🎙️ Listening… speak now";
          status.textContent = "🎙️ Listening… pronounce clearly.";
          status.className = "pron-status listen";
          U().listenOnce({ ms: 4500, lang: "en-US" }).then((res) => {
            micBtn.disabled = false;
            micBtn.textContent = "🎤 Speak into mic";
            if (!res.ok) {
              verifyPronunciation();
              return;
            }
            verifyPronunciation(res.transcript);
          });
        }

        function retry() {
          U().speak(item.word, { slow: true });
          status.textContent = "Listen carefully, then try saying it out loud again.";
          status.className = "pron-status hear";
        }

        function grade(good) {
          if (good) {
            score++;
            U().sfx.correct();
          } else {
            U().sfx.wrong();
            U().speak(item.word, { slow: true });
          }
          setTimeout(next, good ? 700 : 1400);
        }
      }, { replace: i > 0 });
    }

    function next() {
      i++;
      if (i < items.length) question();
      else roundEnd("Pronunciation Drill", score, items.length, pronunciationDrill);
    }

    question();
  }

  /* =================================================================
     GAME 2 — Fill in the Blank (grammar)
     ================================================================= */
  function fillBlank() {
    const grammar = C().grammar || [];
    if (!grammar.length) {
      U().alertBox("No grammar sentences available!");
      return;
    }
    const deck = U().newSessionDeck(grammar, "solo_fillBlank");
    const pool = deck.draw(Math.min(ROUND, grammar.length)) || [];
    if (!pool.length) {
      U().alertBox("No grammar questions available!");
      return;
    }
    let i = 0, score = 0;

    function question() {
      const item = pool[i];
      if (!item) {
        roundEnd("Fill in the Blank", score, i, fillBlank);
        return;
      }
      const options = U().shuffle(item.options || []);
      U().show((scr) => {
        const h = U().h;
        header(scr, "✍️ Fill in the Blank", i, score);
        const card = h("div", { class: "play-card" });
        card.appendChild(h("small", { class: "section-sub" }, [item.cat || "Grammar"]));
        card.appendChild(h("div", { class: "prompt-word", style: "font-size: clamp(1.4rem,4vw,2.2rem)" }, [
          (item.sentence || "").replace("___", "____")
        ]));

        const optWrap = h("div", { class: "options" });
        const buttons = [];
        options.forEach((o) => {
          const b = h("button", { class: "opt", onclick: () => choose(o, b) }, [o]);
          buttons.push(b);
          optWrap.appendChild(b);
        });
        card.appendChild(optWrap);
        const fb = h("div", { class: "feedback" });
        card.appendChild(fb);
        scr.appendChild(card);

        function choose(chosen, btn) {
          buttons.forEach((b) => (b.disabled = true));
          const full = (item.sentence || "").replace("___", item.answer);
          if (chosen === item.answer) {
            btn.classList.add("correct");
            U().sfx.correct();
            fb.className = "feedback ok";
            fb.appendChild(document.createTextNode("Correct! ✅"));
            score++;
          } else {
            btn.classList.add("wrong");
            U().sfx.wrong();
            const correctBtn = buttons.find((b) => b.textContent === item.answer);
            if (correctBtn) correctBtn.classList.add("correct");
            fb.className = "feedback no";
            fb.appendChild(document.createTextNode("Answer: " + full));
          }
          if (item.meaning || item.fr) {
            const hint = h("div", { class: "fr-hint-box mt", style: "margin-top:10px" }, [
              item.meaning ? h("div", {}, ["🇬🇧 ", item.meaning]) : null,
              item.fr ? h("div", { class: "fr" }, ["🇫🇷 ", item.fr]) : null
            ]);
            fb.appendChild(hint);
          }
          fb.appendChild(U().h("span", { class: "fr" }, ["🔊 " + full]));
          U().speak(full);
          setTimeout(next, 1700);
        }
      }, { replace: i > 0 });
    }

    function next() {
      i++;
      if (i < pool.length) question();
      else roundEnd("Fill in the Blank", score, pool.length, fillBlank);
    }
    question();
  }

  /* =================================================================
     GAME — Irregular Verbs
     Ask for the past simple, past participle, or definition.
     ================================================================= */
  function irregularVerbs() {
    const pool = (C().irregularVerbs || []).filter((v) => v && v.verb && v.past && v.participle);
    if (pool.length < 4) {
      U().alertBox("Not enough irregular verbs available (need at least 4)!");
      return;
    }

    const deck = U().newSessionDeck(pool, "solo_irregular");
    const sessionItems = deck.draw(Math.min(ROUND, pool.length)) || [];
    if (!sessionItems.length) {
      U().alertBox("No irregular verb questions available!");
      return;
    }

    let i = 0, score = 0;

    function normalize(text) {
      return String(text || "").trim().toLowerCase();
    }

    function pickQuestionType() {
      const roll = Math.random();
      if (roll < 0.55) return "participle";
      if (roll < 0.85) return "past";
      return "meaning";
    }

    function pickDistractors(item, field, count) {
      const correct = normalize(item[field] || "");
      const others = U().shuffle(pool.filter((v) => v.verb !== item.verb))
        .map((v) => (field === "meaning" ? (v.meaning || v.fr) : (field === "past" ? v.past : v.participle)))
        .filter((m) => m && normalize(m) !== correct);
      const unique = [];
      others.forEach((m) => {
        const norm = normalize(m);
        if (!unique.some((x) => normalize(x) === norm)) unique.push(m);
      });
      return unique.slice(0, count);
    }

    function question() {
      const item = sessionItems[i];
      if (!item) {
        roundEnd("Irregular Verbs", score, i, irregularVerbs);
        return;
      }

      const type = pickQuestionType();
      let prompt = "";
      let correct = "";
      let options = [];

      if (type === "past") {
        prompt = `What is the past simple of "${item.verb}"?`;
        correct = item.past;
      } else if (type === "participle") {
        prompt = `What is the past participle of "${item.verb}"?`;
        correct = item.participle;
      } else {
        const field = Math.random() > 0.5 ? "meaning" : "fr";
        const correctValue = item[field] || item.meaning || item.fr;
        prompt = `Which definition matches "${item.verb}"?`;
        correct = correctValue;
        options = U().shuffle([correctValue].concat(pickDistractors(item, field, 3)));
      }

      U().show((scr) => {
        const h = U().h;
        header(scr, "🔁 Irregular Verbs", i, score);
        const card = h("div", { class: "play-card" });
        card.appendChild(h("small", { class: "section-sub" }, [type === "past" ? "Past simple" : type === "participle" ? "Past participle" : "Definition"]));
        card.appendChild(h("div", { class: "prompt-word", style: "font-size:clamp(1.6rem,5vw,2.6rem)" }, [item.verb]));
        card.appendChild(h("p", { class: "section-sub" }, [prompt]));

        const fb = h("div", { class: "feedback" });
        card.appendChild(fb);

        if (type === "meaning") {
          const optWrap = h("div", { class: "options" });
          const buttons = [];
          options.forEach((o) => {
            const b = h("button", { class: "opt", onclick: () => chooseMeaning(o, b) }, [o]);
            buttons.push(b);
            optWrap.appendChild(b);
          });
          card.appendChild(optWrap);
        } else {
          const input = h("input", {
            type: "text",
            placeholder: type === "past" ? "Write the past simple" : "Write the past participle",
            style: "width:100%;max-width:340px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);margin-top:10px"
          });
          const checkBtn = h("button", {
            class: "btn btn-primary mt",
            onclick: () => chooseForm(input.value)
          }, ["Check"]);
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") chooseForm(input.value);
          });
          card.appendChild(input);
          card.appendChild(checkBtn);
        }
        scr.appendChild(card);

        function chooseForm(answer) {
          const normalized = normalize(answer);
          const expected = normalize(correct);
          const buttons = card.querySelectorAll("button");
          buttons.forEach((btn) => (btn.disabled = true));
          if (normalized === expected) {
            U().sfx.correct();
            fb.className = "feedback ok";
            fb.textContent = "Correct! ✅";
            score++;
          } else {
            U().sfx.wrong();
            fb.className = "feedback no";
            fb.textContent = `Answer: ${correct}`;
          }
          setTimeout(next, 1400);
        }

        function chooseMeaning(chosen, btn) {
          const buttons = card.querySelectorAll("button");
          buttons.forEach((b) => (b.disabled = true));
          if (normalize(chosen) === normalize(correct)) {
            btn.classList.add("correct");
            U().sfx.correct();
            fb.className = "feedback ok";
            fb.textContent = "Correct! ✅";
            score++;
          } else {
            btn.classList.add("wrong");
            U().sfx.wrong();
            const correctBtn = buttons.find((b) => normalize(b.textContent) === normalize(correct));
            if (correctBtn) correctBtn.classList.add("correct");
            fb.className = "feedback no";
            fb.textContent = `Answer: ${correct}`;
          }
          setTimeout(next, 1400);
        }
      }, { replace: i > 0 });
    }

    function next() {
      i++;
      if (i < sessionItems.length) question();
      else roundEnd("Irregular Verbs", score, sessionItems.length, irregularVerbs);
    }

    question();
  }

  /* =================================================================
     GAME — Phrasal Verbs (meaning match: FR or EN)
     Show a phrasal verb; pick the correct meaning.
     ================================================================= */
  function phrasalVerbs() {
    const pool = (C().phrasalVerbs || []).filter((v) => v && v.verb && (v.meaning || v.fr));
    if (pool.length < 4) {
      U().alertBox("Not enough phrasal verbs available (need at least 4)!");
      return;
    }

    let lang = "fr"; // "fr" or "en"

    function pickDistractors(item, field, count) {
      const correct = field === "fr" ? item.fr : item.meaning;
      const others = U().shuffle(pool.filter((v) => v.verb !== item.verb))
        .map((v) => (field === "fr" ? v.fr : v.meaning))
        .filter((m) => m && m !== correct);
      const unique = [];
      others.forEach((m) => { if (!unique.includes(m)) unique.push(m); });
      return unique.slice(0, count);
    }

    function startGame() {
      const deck = U().newSessionDeck(pool, "solo_phrasal_" + lang);
      const sessionItems = deck.draw(Math.min(ROUND, pool.length)) || [];
      if (!sessionItems.length) {
        U().alertBox("No phrasal verb questions available!");
        return;
      }
      let i = 0, score = 0;
      const field = lang === "fr" ? "fr" : "meaning";
      const langLabel = lang === "fr" ? "🇫🇷 French" : "🇬🇧 English";

      function question() {
        const item = sessionItems[i];
        if (!item) {
          roundEnd("Phrasal Verbs (" + langLabel + ")", score, i, () => phrasalVerbs());
          return;
        }
        const correct = item[field];
        const distractors = pickDistractors(item, field, 3);
        const options = U().shuffle([correct].concat(distractors));

        U().show((scr) => {
          const h = U().h;
          header(scr, "🔗 Phrasal Verbs", i, score);
          const card = h("div", { class: "play-card" });
          card.appendChild(h("small", { class: "section-sub" }, ["What does this phrasal verb mean? (" + langLabel + ")"]));
          card.appendChild(h("div", { class: "prompt-word", style: "font-size:clamp(1.6rem,5vw,2.6rem)" }, [item.verb]));
          card.appendChild(h("button", {
            class: "speaker mt", style: "margin:8px auto;display:block",
            onclick: () => U().speak(item.verb)
          }, ["🔊 Listen"]));

          const optWrap = h("div", { class: "options" });
          const buttons = [];
          options.forEach((o) => {
            const b = h("button", { class: "opt", onclick: () => choose(o, b) }, [o]);
            buttons.push(b);
            optWrap.appendChild(b);
          });
          card.appendChild(optWrap);
          const fb = h("div", { class: "feedback" });
          card.appendChild(fb);
          scr.appendChild(card);

          function choose(chosen, btn) {
            buttons.forEach((b) => (b.disabled = true));
            if (chosen === correct) {
              btn.classList.add("correct");
              U().sfx.correct();
              fb.className = "feedback ok";
              fb.textContent = "Correct! ✅";
              score++;
            } else {
              btn.classList.add("wrong");
              U().sfx.wrong();
              const correctBtn = buttons.find((b) => b.textContent === correct);
              if (correctBtn) correctBtn.classList.add("correct");
              fb.className = "feedback no";
              fb.textContent = "Answer: " + correct;
            }
            const otherLang = field === "fr" ? "meaning" : "fr";
            if (item[otherLang]) {
              fb.appendChild(h("div", { class: "fr mt", style: "margin-top:8px" }, [
                (field === "fr" ? "🇬🇧 " : "🇫🇷 ") + item[otherLang]
              ]));
            }
            setTimeout(next, 1800);
          }
        }, { replace: i > 0 });
      }

      function next() {
        i++;
        if (i < sessionItems.length) question();
        else roundEnd("Phrasal Verbs (" + langLabel + ")", score, sessionItems.length, () => phrasalVerbs());
      }
      question();
    }

    U().show((scr) => {
      const h = U().h;
      scr.appendChild(h("h2", { class: "section-title" }, ["🔗 Phrasal Verbs"]));
      scr.appendChild(h("p", { class: "section-sub" }, ["Choose the language for the meanings:"]));
      const pills = h("div", { class: "pill-group mt" });
      [["🇫🇷 French meanings", "fr"], ["🇬🇧 English meanings", "en"]].forEach(([label, val]) => {
        pills.appendChild(h("button", {
          class: "pill" + (lang === val ? " active" : ""),
          onclick: () => { lang = val; renderPills(); }
        }, [label]));
      });
      function renderPills() {
        pills.querySelectorAll(".pill").forEach((btn, idx) => {
          btn.classList.toggle("active", (idx === 0 && lang === "fr") || (idx === 1 && lang === "en"));
        });
      }
      scr.appendChild(pills);
      scr.appendChild(h("div", { class: "row center mt-lg" }, [
        h("button", { class: "btn btn-primary", onclick: startGame }, ["Start 🚀"]),
        h("button", { class: "btn btn-ghost", onclick: menu }, ["Back"])
      ]));
    });
  }

  /* =================================================================
     GAME 3 — Anagram (timed): a scrambled word appears, you type it.
     Correct = +1 and next word; wrong = -5s off the clock; up to 3 passes.
     ================================================================= */
  function anagram() {
    const anagramWords = C().anagramWords || [];
    if (!anagramWords.length) {
      U().alertBox("No anagram words available!");
      return;
    }
    const deck = U().newSessionDeck(anagramWords, "solo_anagram");
    function draw() {
      return deck.draw();
    }
    function findVocab(word) {
      return (C().vocabulary || []).find((v) => v.en.toLowerCase() === word.toLowerCase());
    }

    let remaining = ANA_TIME, timer = null, done = false;
    let score = 0, passesUsed = 0;
    let word = null, scrambled = null, meta = null;
    function loadWord() {
      word = draw();
      if (!word) {
        endRound();
        return;
      }
      meta = findVocab(word) || { emoji: "🔤" };
      // Guarantee scramble is different from original (try up to 5 times)
      for (let t = 0; t < 5; t++) {
        scrambled = U().shuffle(word.split(""));
        if (scrambled.join("") !== word || word.length <= 1) break;
      }
    }
    loadWord();

    U().show((scr) => {
      const h = U().h;

      const scoreNode = h("b", {}, [String(score)]);
      scr.appendChild(h("div", { class: "hud" }, [
        h("span", {}, ["🔤 Anagram"]),
        h("span", {}, ["Solved: ", scoreNode])
      ]));

      const card = h("div", { class: "play-card" });
      const emoji = h("div", { class: "prompt-emoji" }, [meta.emoji]);
      card.appendChild(emoji);

      // lettres mélangées (mêmes tuiles que les autres jeux)
      const tilesBox = h("div", { class: "wb-letters" });
      function renderTiles() {
        tilesBox.innerHTML = "";
        scrambled.forEach((l) => tilesBox.appendChild(h("span", { class: "wb-tile" }, [l.toUpperCase()])));
      }
      renderTiles();
      card.appendChild(tilesBox);

      const hint = h("p", { class: "section-sub", style: "text-align:center" }, ["Hint: " + word.length + " letters"]);
      card.appendChild(hint);

      // chrono
      const bar = h("i");
      const chrono = h("div", { class: "chrono" }, [bar]);
      const chronoLabel = h("div", { class: "chrono-label center row", style: "justify-content:center" }, [Math.ceil(remaining) + "s"]);
      card.appendChild(chrono); card.appendChild(chronoLabel);

      // saisie
      const input = h("input", {
        type: "text", placeholder: "Type the word…", autocomplete: "off",
        onkeydown: (e) => { if (e.key === "Enter") submit(); }
      });
      const addBtn = h("button", { class: "btn btn-primary", onclick: () => submit() }, ["Check ✓"]);
      card.appendChild(h("div", { class: "wc-input-row" }, [input, addBtn]));

      function passLabel() { return "🔁 Pass (" + (ANA_MAX_PASS - passesUsed) + " left)"; }
      const passBtn = h("button", { class: "btn btn-ghost", onclick: () => pass() }, [passLabel()]);
      const speakBtn = h("button", { class: "speaker", title: "Listen", onclick: () => U().speak(word) }, ["🔊"]);
      card.appendChild(h("div", { class: "row center mt" }, [passBtn, speakBtn]));

      const feedback = h("div", { class: "feedback" }, [""]);
      card.appendChild(feedback);
      scr.appendChild(card);

      setTimeout(() => { try { input.focus(); } catch (e) { /* ignore */ } }, 60);
      timer = setInterval(tick, 100);

      function applyChrono() {
        bar.style.width = Math.max(0, (remaining / ANA_TIME) * 100) + "%";
        chronoLabel.textContent = Math.max(0, Math.ceil(remaining)) + "s";
      }
      function refresh() { renderTiles(); hint.textContent = "Hint: " + word.length + " letters"; emoji.textContent = meta.emoji; }
      function tick() {
        if (bar.isConnected === false) { clearInterval(timer); return; }
        remaining -= 0.1;
        applyChrono();
        if (remaining <= 5 && remaining > 0) U().sfx.tick();
        if (remaining <= 0) endRound();
      }
      function submit() {
        if (done) return;
        const raw = (input.value || "").trim();
        if (!raw) return;
        if (raw.toLowerCase() === word.toLowerCase()) {
          score++; scoreNode.textContent = String(score);
          U().sfx.correct();
          feedback.className = "feedback ok"; feedback.textContent = "Perfect! ✅ " + word;
          U().speak(word);
          loadWord(); refresh();
        } else {
          U().sfx.wrong();
          remaining = Math.max(0, remaining - ANA_PENALTY);
          applyChrono();
          feedback.className = "feedback no"; feedback.textContent = '❌ "' + raw + '"  (−' + ANA_PENALTY + 's)';
          if (remaining <= 0) { input.value = ""; endRound(); return; }
        }
        input.value = ""; try { input.focus(); } catch (e) {}
      }
      function pass() {
        if (done) return;
        if (passesUsed >= ANA_MAX_PASS) { feedback.className = "feedback no"; feedback.textContent = "No passes left!"; return; }
        passesUsed++;
        U().sfx.tick();
        feedback.className = "feedback"; feedback.textContent = "⏭️ The word was: " + word;
        U().speak(word);
        loadWord(); refresh();
        passBtn.textContent = passLabel();
        if (passesUsed >= ANA_MAX_PASS) passBtn.disabled = true;
        try { input.focus(); } catch (e) {}
      }
      function endRound() {
        if (done) return; done = true; if (timer) clearInterval(timer);
        anagramEnd(score);
      }
    });
  }

  /* ---------- Solo Mystery Object ---------- */
  function mysteryObject() {
    renderLevelSelector("Mystery Object", "🔍", "Choose difficulty level for mystery object clues:", (tier) => startMysteryObject(tier));
  }

  function startMysteryObject(tier) {
    const vocabPool = (C().vocabulary || []).filter((v) => v && v.en && (v.meaning || v.fr));
    const mysteryPool = (C().mysteryObjects || []).map((m) => ({ en: m.word, meaning: m.clue, fr: m.fr, emoji: m.emoji || "🔍", cat: "Mystery" }));
    let pool = U().uniqueById(vocabPool.concat(mysteryPool));

    if (tier && tier !== "all") {
      const filtered = pool.filter((v) => {
        const len = (v.en || "").length;
        if (tier === "easy") return len <= 5 || (v.level || "easy") === "easy";
        if (tier === "medium") return (len > 5 && len <= 7) || (v.level || "medium") === "medium";
        if (tier === "hard") return len >= 7 || (v.level || "hard") === "hard";
        return true;
      });
      if (filtered.length >= 4) pool = filtered;
    }

    const deck = U().newSessionDeck(pool, "solo_mystery_" + tier);
    const sessionItems = deck.draw(Math.min(ROUND, pool.length)) || [];
    if (!sessionItems.length) {
      U().alertBox("No mystery object items available for this tier!");
      return;
    }

    let idx = 0, score = 0;

    function next() {
      if (idx >= sessionItems.length) {
        markProgress(score);
        U().sfx.win();
        U().confetti(1800);
        U().show((scr) => {
          const h = U().h;
          scr.appendChild(h("div", { class: "play-card solo-play-card" }, [
            h("div", { class: "prompt-emoji" }, ["🏆"]),
            h("h2", { class: "section-title" }, ["Round finished!"]),
            h("p", { class: "section-sub" }, ["Mystery Object Practice"]),
            h("div", { class: "prompt-word" }, [String(score) + " / " + String(sessionItems.length * 10) + " pts"]),
            h("div", { class: "row center mt-lg" }, [
              h("button", { class: "btn btn-primary", onclick: () => startMysteryObject(tier) }, ["Play again"]),
              h("button", { class: "btn btn-ghost", onclick: menu }, ["Other games"])
            ])
          ]));
        }, { replace: true });
        return;
      }

      const item = sessionItems[idx];
      if (!item) { idx++; next(); return; }
      let hintUsed = false;
      let roundScore = 10;

      U().show((scr) => {
        const h = U().h;
        header(scr, "🔍 Mystery Object", idx, score, tier);

        const card = h("div", { class: "play-card solo-play-card obj-desc-card" });
        card.appendChild(h("div", { class: "topic-tag" }, ["Category: " + (item.cat || "Vocabulary")]));

        const cluesBox = h("div", { class: "clues-box mt" });
        cluesBox.appendChild(h("h3", { class: "clues-title" }, ["💡 English Clue:"]));
        cluesBox.appendChild(h("p", { class: "clue-text", style: "font-size:1.25rem; font-weight:600; color:var(--ink); margin-top:8px;" }, [item.meaning || "Guess the word!"]));
        card.appendChild(cluesBox);

        // Sound button for Audio hint
        card.appendChild(h("button", {
          class: "btn btn-ghost mt",
          style: "margin-top:10px",
          onclick: () => U().speak(item.en)
        }, ["🔊 Listen to pronunciation hint"]));

        const frHintBox = h("div", { class: "fr-hint-box hidden mt" });
        frHintBox.appendChild(h("div", { class: "fr-hint-word" }, ["🇫🇷 Traduction : " + (item.fr || "")]));
        card.appendChild(frHintBox);

        const hintBtn = h("button", {
          class: "btn btn-hint mt",
          onclick: () => {
            if (hintUsed) return;
            hintUsed = true;
            frHintBox.classList.remove("hidden");
            hintBtn.disabled = true;
            hintBtn.textContent = "🇫🇷 Traduction affichée (-2 pts penalty)";
            roundScore = 8;
            U().sfx.gift();
          }
        }, ["🇫🇷 Voir la traduction en français (-2 pts)"]);
        card.appendChild(hintBtn);

        const feedback = h("div", { class: "feedback mt" });

        if (tier === "easy" || tier === "medium") {
          // Provide 4 Multiple Choice buttons for easy/medium
          const distractors = U().pickDistractors(pool, item, 3, (w) => w.en);
          const options = U().shuffle([item].concat(distractors));
          const optWrap = h("div", { class: "options mt-lg" });
          const buttons = [];
          options.forEach((o) => {
            const b = h("button", { class: "opt", onclick: () => chooseMCQ(o, b) }, [o.en]);
            buttons.push(b);
            optWrap.appendChild(b);
          });
          card.appendChild(optWrap);
          card.appendChild(feedback);

          function chooseMCQ(chosen, btn) {
            buttons.forEach((b) => (b.disabled = true));
            hintBtn.disabled = true;
            if (chosen.en.toLowerCase() === item.en.toLowerCase()) {
              btn.classList.add("correct");
              score += roundScore;
              feedback.className = "feedback ok";
              feedback.innerHTML = `✅ Correct! +${roundScore} pts (${item.emoji || ""} ${item.en} = ${item.fr || ""})`;
              U().sfx.correct();
            } else {
              btn.classList.add("wrong");
              const correctBtn = buttons.find((b) => b.textContent.toLowerCase() === item.en.toLowerCase());
              if (correctBtn) correctBtn.classList.add("correct");
              feedback.className = "feedback no";
              feedback.innerHTML = `The answer was: <b>${item.emoji || ""} ${item.en}</b> (${item.fr || ""})`;
              U().sfx.wrong();
            }
            U().speak(item.en);
            setTimeout(() => { idx++; next(); }, 1800);
          }
        } else {
          // Direct Text Input with SQLite word validation check
          const input = h("input", {
            type: "text", placeholder: "Type your answer in English...",
            style: "width:100%; max-width:380px; padding:14px 18px; border-radius:12px; font-size:1.15rem; background:var(--card-2); border:1px solid var(--line); color:var(--ink); margin-top:16px;",
            onkeydown: (e) => { if (e.key === "Enter") check(); }
          });
          card.appendChild(h("div", { class: "wc-input-row mt" }, [input]));
          card.appendChild(feedback);

          const checkBtn = h("button", { class: "btn btn-primary mt", onclick: () => check() }, ["Submit 🚀"]);
          const passBtn = h("button", { class: "btn btn-ghost mt", onclick: () => reveal(false) }, ["Pass ⏭️"]);
          card.appendChild(h("div", { class: "row center mt" }, [checkBtn, passBtn]));

          setTimeout(() => input.focus(), 50);

          async function check() {
            const val = (input.value || "").trim().toLowerCase();
            const target = item.en.trim().toLowerCase();
            if (!val) return;
            const isValidSqlite = await U().validateEnglishWord(val);

            if (val === target) {
              reveal(true);
            } else {
              feedback.className = "feedback no";
              feedback.textContent = `❌ Try again! ${isValidSqlite ? "('" + val + "' is a valid word, but not the target item)" : "('" + val + "' is not recognized)"}`;
              U().sfx.wrong();
            }
          }

          function reveal(correct) {
            input.disabled = true; checkBtn.disabled = true; passBtn.disabled = true; hintBtn.disabled = true;
            if (correct) {
              score += roundScore;
              feedback.className = "feedback ok";
              feedback.innerHTML = `✅ Correct! +${roundScore} pts (${item.emoji || ""} ${item.en} = ${item.fr || ""})`;
              U().sfx.correct();
            } else {
              feedback.className = "feedback no";
              feedback.innerHTML = `The word was: <b>${item.emoji || ""} ${item.en}</b> (${item.fr || ""})`;
              U().sfx.wrong();
            }
            U().speak(item.en);
            card.appendChild(h("div", { class: "row center mt-lg" }, [
              h("button", { class: "speaker", onclick: () => U().speak(item.en) }, ["🔊"]),
              h("button", { class: "btn btn-primary", onclick: () => { idx++; next(); } }, ["Next ➔"])
            ]));
          }
        }

        scr.appendChild(card);
      });
    }

    next();
  }

  function anagramEnd(score) {
    markProgress(score);
    U().sfx.win();
    U().confetti(1800);
    U().show((scr) => {
      const h = U().h;
      scr.appendChild(h("div", { class: "play-card" }, [
        h("div", { class: "prompt-emoji" }, [score >= 8 ? "🌟" : score >= 4 ? "👍" : "💪"]),
        h("h2", { class: "section-title" }, ["Time's up!"]),
        h("p", { class: "section-sub" }, ["Anagram"]),
        h("div", { class: "prompt-word" }, [String(score) + (score === 1 ? " word" : " words") + " solved"]),
        h("div", { class: "row center mt-lg" }, [
          h("button", { class: "btn btn-primary", onclick: anagram }, ["Play again"]),
          h("button", { class: "btn btn-ghost", onclick: menu }, ["Other games"])
        ])
      ]));
    }, { replace: true });
  }

  /* ---------- Alphabet Race (Solo Mode) ---------- */
  function alphabetRace() {
    let totalSec = 90;
    let minLength = 3;

    U().show((scr) => {
      const h = U().h;
      scr.appendChild(h("h2", { class: "section-title" }, ["🔠 Alphabet Race — Solo"]));
      scr.appendChild(h("p", { class: "section-sub" }, ["Race through the letters A to Z. Find a valid English word for each letter!"]));

      const timePills = h("div", { class: "pill-group" });
      const lengthPills = h("div", { class: "pill-group" });

      function renderTime() {
        timePills.innerHTML = "";
        [["60s", 60], ["90s", 90], ["120s", 120]].forEach(([label, val]) => {
          timePills.appendChild(h("button", {
            class: "pill" + (totalSec === val ? " active" : ""),
            onclick: () => { totalSec = val; renderTime(); }
          }, [label]));
        });
      }

      function renderLength() {
        lengthPills.innerHTML = "";
        [["3 letters", 3], ["4 letters", 4], ["5 letters", 5]].forEach(([label, val]) => {
          lengthPills.appendChild(h("button", {
            class: "pill" + (minLength === val ? " active" : ""),
            onclick: () => { minLength = val; renderLength(); }
          }, [label]));
        });
      }

      renderTime();
      renderLength();

      scr.appendChild(h("div", { class: "setup-opts mt" }, [
        h("div", {}, [h("div", { class: "section-sub" }, ["Total game time"]), timePills]),
        h("div", {}, [h("div", { class: "section-sub" }, ["Minimum word length"]), lengthPills])
      ]));

      scr.appendChild(h("div", { class: "row center mt-lg" }, [
        h("button", { class: "btn btn-primary", onclick: () => runAlphabetRaceSolo({ totalSec, minLength }) }, ["🚀 Start Race!"]),
        h("button", { class: "btn btn-ghost", onclick: menu }, ["Back"])
      ]));
    });
  }

  function runAlphabetRaceSolo(opts) {
    const totalSec = opts.totalSec || 90;
    const minLength = opts.minLength || 3;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    let currentIndex = 0;
    let remaining = totalSec;
    let score = 0;
    const usedWords = new Set();
    const wordsDone = {};
    let timer = null;

    async function isValidSoloWord(word) {
      if (!word || !/^[A-Za-z]+$/.test(word)) return false;
      return await U().validateEnglishWord(word);
    }

    timer = setInterval(() => {
      remaining -= 0.1;
      if (remaining <= 0) {
        clearInterval(timer);
        remaining = 0;
        finishSoloRace();
      }
    }, 100);

    function finishSoloRace() {
      if (timer) clearInterval(timer);
      const completedCount = Object.keys(wordsDone).length;
      markProgress(completedCount);
      U().sfx.win();
      U().confetti(1800);

      U().show((scr) => {
        const h = U().h;
        scr.appendChild(h("div", { class: "play-card" }, [
          h("div", { class: "prompt-emoji" }, [completedCount >= 20 ? "🌟" : completedCount >= 10 ? "👍" : "💪"]),
          h("h2", { class: "section-title" }, ["Race Complete!"]),
          h("p", { class: "section-sub" }, ["Alphabet Race Solo"]),
          h("div", { class: "prompt-word" }, [`${completedCount}/26 letters completed (${score} pts)`]),
          h("div", { class: "row center mt-lg" }, [
            h("button", { class: "btn btn-primary", onclick: alphabetRace }, ["Play again"]),
            h("button", { class: "btn btn-ghost", onclick: menu }, ["Other games"])
          ])
        ]));
      }, { replace: true });
    }

    function renderTurn(message) {
      if (remaining <= 0 || currentIndex >= alphabet.length) {
        finishSoloRace();
        return;
      }

      const letter = alphabet[currentIndex];

      U().show((scr) => {
        const h = U().h;
        const alphabetRow = h("div", { class: "alphabet-board" },
          alphabet.map((ch, idx) => {
            const isDone = wordsDone[ch];
            const isCurrent = idx === currentIndex;
            let cls = "alphabet-tile";
            if (isCurrent) cls += " current";
            else if (isDone) cls += " completed";
            return h("span", { class: cls, title: isDone ? `${ch}: ${isDone}` : ch }, [ch]);
          })
        );
        scr.appendChild(alphabetRow);

        const input = h("input", {
          type: "text",
          placeholder: "Type a word starting with " + letter + "...",
          autocomplete: "off",
          onkeydown: (e) => { if (e.key === "Enter") submitWord(); }
        });
        const feedback = h("div", { class: "alphabet-feedback" }, [message || " "]);

        scr.appendChild(h("div", { class: "alphabet-card" }, [
          h("div", { class: "turn-banner" }, [
            "🔠 Solo Race — letter ", h("span", { class: "ans" }, [letter])
          ]),
          h("div", { class: "gd-question" }, [
            h("div", { class: "topic-tag" }, ["Letter " + letter]),
            h("div", { class: "q" }, ["Enter an English word starting with " + letter + " (min " + minLength + " letters)."])
          ]),
          h("div", { class: "alphabet-status" }, [
            h("span", {}, ["Progress: ", currentIndex + 1, "/26"]),
            h("span", {}, ["Score: ", score, " pts"]),
            h("span", {}, ["Time: ", Math.ceil(remaining), "s"])
          ]),
          h("div", { class: "alphabet-input-row" }, [
            input,
            h("div", { class: "alphabet-actions" }, [
              h("button", { class: "btn btn-primary", onclick: submitWord }, ["Submit"]),
              h("button", { class: "btn btn-ghost", onclick: passWord }, ["Pass"])
            ])
          ]),
          feedback
        ]));

        const remainingLabel = h("div", { class: "chrono-label center row", style: "justify-content:center;margin-top:.75rem;" }, [Math.ceil(remaining) + "s left"]);
        const remainingInterval = setInterval(() => {
          if (!remainingLabel.isConnected) {
            clearInterval(remainingInterval);
            return;
          }
          remainingLabel.textContent = Math.ceil(remaining) + "s left";
        }, 100);

        const progressBar = h("div", { class: "progress-bar alphabet-progress" }, [
          h("div", {
            class: "progress-fill",
            style: { width: Math.max(0, remaining * 100 / totalSec) + "%" }
          }, [])
        ]);

        scr.appendChild(progressBar);
        scr.appendChild(remainingLabel);
        scr.appendChild(h("div", { class: "row center mt-lg" }, [
          h("button", { class: "btn btn-ghost", onclick: () => { remaining = 0; finishSoloRace(); } }, ["🏁 Finish early"])
        ]));

        input.focus();

        function normalizeWord(value) {
          return String(value || "").trim().replace(/[^A-Za-z]/g, "").toUpperCase();
        }

        function proceedNext(msg) {
          currentIndex++;
          if (currentIndex >= alphabet.length || remaining <= 0) {
            finishSoloRace();
            return;
          }
          renderTurn(msg);
        }

        async function submitWord() {
          const raw = normalizeWord(input.value);
          if (!raw) {
            feedback.textContent = "Please type a word.";
            return;
          }
          if (raw.charAt(0) !== letter) {
            feedback.textContent = "Word must start with " + letter + ".";
            input.value = "";
            input.focus();
            return;
          }
          if (raw.length < minLength) {
            feedback.textContent = "At least " + minLength + " letters required.";
            input.value = "";
            input.focus();
            return;
          }
          if (usedWords.has(raw)) {
            feedback.textContent = "You already used '" + raw + "'!";
            input.value = "";
            input.focus();
            return;
          }
          const valid = await isValidSoloWord(raw);
          if (!valid) {
            feedback.textContent = "⚠️ '" + raw + "' is not recognized as a valid English word.";
            input.value = "";
            input.focus();
            return;
          }

          usedWords.add(raw);
          wordsDone[letter] = raw;
          const pts = raw.length * 5 + Math.ceil(remaining / 10);
          score += pts;
          U().speak(raw);
          proceedNext("✅ " + raw + " (+" + pts + " pts)");
        }

        function passWord() {
          proceedNext("Passed letter " + letter + ".");
        }
      }, { replace: true });
    }

    renderTurn();
  }

  return { menu };
})();
