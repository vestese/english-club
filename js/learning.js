/**
 * Club Anglais Accra — Learning Hub Logic
 * Interactive Learning UI script
 */

document.addEventListener('DOMContentLoaded', () => {

  // Global Content Access
  const content = (window.CAA && window.CAA.content) || {};
  const vocabulary = content.vocabulary || [];
  const pronunciationWords = content.pronunciationWords || [];
  const phrasalVerbs = content.phrasalVerbs || [];
  const irregularVerbs = content.irregularVerbs || [];
  const grammar = content.grammar || [];

  // Speech Synthesis Helper
  function speakWord(text, btnElement) {
    if (!('speechSynthesis' in window)) {
      alert('La synthèse vocale n\'est pas supportée sur ce navigateur.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    if (btnElement) {
      btnElement.style.transform = 'scale(1.25)';
      btnElement.style.background = 'var(--brand)';
      btnElement.style.color = 'var(--brand-ink)';
    }

    utterance.onend = () => {
      if (btnElement) {
        btnElement.style.transform = '';
        btnElement.style.background = '';
        btnElement.style.color = '';
      }
    };

    utterance.onerror = () => {
      if (btnElement) {
        btnElement.style.transform = '';
        btnElement.style.background = '';
        btnElement.style.color = '';
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  // --- STATS & BADGES ---
  function updateCounters(lessonCount = 0) {
    document.getElementById('statVocab').textContent = vocabulary.length;
    document.getElementById('statPron').textContent = pronunciationWords.length;
    document.getElementById('statPhrasal').textContent = phrasalVerbs.length;
    document.getElementById('statIrregular').textContent = irregularVerbs.length;
    document.getElementById('statGrammar').textContent = grammar.length;

    document.getElementById('badgeVocab').textContent = vocabulary.length;
    document.getElementById('badgePron').textContent = pronunciationWords.length;
    document.getElementById('badgePhrasal').textContent = phrasalVerbs.length;
    document.getElementById('badgeIrregular').textContent = irregularVerbs.length;
    document.getElementById('badgeGrammar').textContent = grammar.length;
    document.getElementById('badgeLessons').textContent = lessonCount;
  }

  // --- TAB SYSTEM ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function switchTab(tabId) {
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `panel-${tabId}`) {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    });

    sessionStorage.setItem('activeLearningTab', tabId);
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const savedTab = sessionStorage.getItem('activeLearningTab');
  if (savedTab && document.getElementById(`panel-${savedTab}`)) {
    switchTab(savedTab);
  }

  // =========================================================================
  // MODULE 1: VOCABULAIRE
  // =========================================================================
  const vocabGrid = document.getElementById('vocabGrid');
  const vocabSearch = document.getElementById('vocabSearch');
  const vocabCatFilter = document.getElementById('vocabCatFilter');
  const vocabLevelFilter = document.getElementById('vocabLevelFilter');

  // Populate categories
  const categories = Array.from(new Set(vocabulary.map(v => v.cat).filter(Boolean))).sort();
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    vocabCatFilter.appendChild(opt);
  });

  function renderVocab() {
    const q = (vocabSearch.value || '').toLowerCase().trim();
    const selectedCat = vocabCatFilter.value;
    const selectedLevel = vocabLevelFilter.value;

    const filtered = vocabulary.filter(item => {
      const matchSearch = !q || (item.en && item.en.toLowerCase().includes(q)) || (item.fr && item.fr.toLowerCase().includes(q));
      const matchCat = !selectedCat || item.cat === selectedCat;
      const matchLevel = !selectedLevel || item.level === selectedLevel;
      return matchSearch && matchCat && matchLevel;
    });

    vocabGrid.innerHTML = '';
    if (filtered.length === 0) {
      vocabGrid.innerHTML = '<div class="empty-lessons">Aucun mot ne correspond à votre recherche.</div>';
      return;
    }

    // Slice for performance (up to 150 items)
    filtered.slice(0, 150).forEach(item => {
      const card = document.createElement('div');
      card.className = 'vocab-card';

      const header = document.createElement('div');
      header.className = 'vocab-header';

      const emoji = document.createElement('span');
      emoji.className = 'vocab-emoji';
      emoji.textContent = item.emoji || '📌';

      const speakBtn = document.createElement('button');
      speakBtn.className = 'vocab-speak-btn';
      speakBtn.innerHTML = '🔊';
      speakBtn.title = 'Écouter la prononciation';
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord(item.en, speakBtn);
      });

      header.appendChild(emoji);
      header.appendChild(speakBtn);

      const enWord = document.createElement('h3');
      enWord.className = 'vocab-word-en';
      enWord.textContent = item.en;

      const frWord = document.createElement('div');
      frWord.className = 'vocab-word-fr';
      frWord.textContent = item.fr;

      const meaning = document.createElement('div');
      meaning.className = 'vocab-meaning';
      meaning.textContent = item.meaning || '';

      const footer = document.createElement('div');
      footer.className = 'vocab-footer';

      if (item.cat) {
        const catBadge = document.createElement('span');
        catBadge.className = 'badge badge-cat';
        catBadge.textContent = item.cat;
        footer.appendChild(catBadge);
      }

      if (item.level) {
        const lvlBadge = document.createElement('span');
        lvlBadge.className = `badge badge-level ${item.level}`;
        lvlBadge.textContent = item.level;
        footer.appendChild(lvlBadge);
      }

      card.appendChild(header);
      card.appendChild(enWord);
      card.appendChild(frWord);
      card.appendChild(meaning);
      card.appendChild(footer);

      vocabGrid.appendChild(card);
    });
  }

  vocabSearch.addEventListener('input', renderVocab);
  vocabCatFilter.addEventListener('change', renderVocab);
  vocabLevelFilter.addEventListener('change', renderVocab);

  // =========================================================================
  // MODULE 2: PRONONCIATION
  // =========================================================================
  const pronGrid = document.getElementById('pronGrid');
  const pronSearch = document.getElementById('pronSearch');
  const pronTrapFilter = document.getElementById('pronTrapFilter');

  function renderPron() {
    const q = (pronSearch.value || '').toLowerCase().trim();
    const selectedTrap = pronTrapFilter.value;

    const filtered = pronunciationWords.filter(item => {
      const matchSearch = !q || (item.word && item.word.toLowerCase().includes(q)) || (item.fr && item.fr.toLowerCase().includes(q));
      const matchTrap = !selectedTrap || (item.trap && item.trap.toLowerCase() === selectedTrap.toLowerCase());
      return matchSearch && matchTrap;
    });

    pronGrid.innerHTML = '';
    if (filtered.length === 0) {
      pronGrid.innerHTML = '<div class="empty-lessons">Aucun résultat trouvé pour cette recherche de prononciation.</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'pron-card';

      const top = document.createElement('div');
      top.className = 'pron-card-top';

      const wordTitle = document.createElement('h3');
      wordTitle.className = 'pron-card-word';
      wordTitle.textContent = item.word;

      const speakBtn = document.createElement('button');
      speakBtn.className = 'vocab-speak-btn';
      speakBtn.innerHTML = '🔊';
      speakBtn.title = 'Écouter le son';
      speakBtn.addEventListener('click', () => speakWord(item.word, speakBtn));

      top.appendChild(wordTitle);
      top.appendChild(speakBtn);

      const fr = document.createElement('div');
      fr.className = 'pron-card-fr';
      fr.textContent = item.fr || '';

      const ipa = document.createElement('div');
      ipa.className = 'ipa-tag';
      ipa.textContent = item.ipa || '';

      const tip = document.createElement('div');
      tip.className = 'pron-card-tip';
      tip.textContent = item.tip || '';

      const focus = document.createElement('div');
      focus.className = 'pron-card-focus';
      focus.textContent = item.focus ? `💡 ${item.focus}` : '';

      card.appendChild(top);
      card.appendChild(fr);
      if (item.ipa) card.appendChild(ipa);
      if (item.trap) {
        const trapPill = document.createElement('span');
        trapPill.className = 'trap-pill';
        trapPill.textContent = item.trap;
        card.appendChild(trapPill);
      }
      card.appendChild(tip);
      if (item.focus) card.appendChild(focus);

      pronGrid.appendChild(card);
    });
  }

  pronSearch.addEventListener('input', renderPron);
  pronTrapFilter.addEventListener('change', renderPron);

  // =========================================================================
  // MODULE 3: PHRASAL VERBS
  // =========================================================================
  const phrasalGrid = document.getElementById('phrasalGrid');
  const phrasalSearch = document.getElementById('phrasalSearch');

  function renderPhrasal() {
    const q = (phrasalSearch.value || '').toLowerCase().trim();

    const filtered = phrasalVerbs.filter(item => {
      const verb = item.verb || item.phrase || '';
      const fr = item.fr || '';
      const meaning = item.meaning || item.en || '';
      return !q || verb.toLowerCase().includes(q) || fr.toLowerCase().includes(q) || meaning.toLowerCase().includes(q);
    });

    phrasalGrid.innerHTML = '';
    if (filtered.length === 0) {
      phrasalGrid.innerHTML = '<div class="empty-lessons">Aucun phrasal verb trouvé.</div>';
      return;
    }

    filtered.forEach(item => {
      const verbText = item.verb || item.phrase || '';
      const card = document.createElement('div');
      card.className = 'phrasal-card';

      const verbEl = document.createElement('h3');
      verbEl.className = 'phrasal-verb';
      verbEl.textContent = verbText;

      const speakBtn = document.createElement('button');
      speakBtn.className = 'vocab-speak-btn';
      speakBtn.innerHTML = '🔊';
      speakBtn.addEventListener('click', () => speakWord(verbText, speakBtn));
      verbEl.appendChild(speakBtn);

      const frEl = document.createElement('div');
      frEl.className = 'phrasal-fr';
      frEl.textContent = item.fr || '';

      const meaningEl = document.createElement('div');
      meaningEl.className = 'phrasal-meaning';
      meaningEl.textContent = item.meaning || item.en || '';

      card.appendChild(verbEl);
      card.appendChild(frEl);
      card.appendChild(meaningEl);

      phrasalGrid.appendChild(card);
    });
  }

  phrasalSearch.addEventListener('input', renderPhrasal);

  // =========================================================================
  // MODULE 4: VERBES IRRÉGULIERS
  // =========================================================================
  const irregularGrid = document.getElementById('irregularGrid');
  const irregularSearch = document.getElementById('irregularSearch');
  const testModeCheck = document.getElementById('testModeCheck');

  function renderIrregular() {
    const q = (irregularSearch.value || '').toLowerCase().trim();
    const isTestMode = testModeCheck.checked;

    if (isTestMode) {
      irregularGrid.classList.add('test-mode-active');
    } else {
      irregularGrid.classList.remove('test-mode-active');
    }

    const filtered = irregularVerbs.filter(item => {
      const verb = item.verb || '';
      const fr = item.fr || '';
      return !q || verb.toLowerCase().includes(q) || fr.toLowerCase().includes(q);
    });

    irregularGrid.innerHTML = '';
    if (filtered.length === 0) {
      irregularGrid.innerHTML = '<div class="empty-lessons">Aucun verbe trouvé.</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'irregular-card';

      const infinitive = document.createElement('h3');
      infinitive.className = 'irregular-infinitive';
      infinitive.textContent = item.verb;

      const speakBtn = document.createElement('button');
      speakBtn.className = 'vocab-speak-btn';
      speakBtn.innerHTML = '🔊';
      speakBtn.addEventListener('click', () => speakWord(item.verb, speakBtn));
      infinitive.appendChild(speakBtn);

      const fr = document.createElement('div');
      fr.className = 'irregular-fr';
      fr.textContent = item.fr || '';

      const formsBox = document.createElement('div');
      formsBox.className = 'irregular-forms';

      const rowPast = document.createElement('div');
      rowPast.className = 'form-row';
      rowPast.innerHTML = `<span class="form-label">Past Simple:</span> <span class="form-val hidden-test">${item.past || '-'}</span>`;

      const rowParticiple = document.createElement('div');
      rowParticiple.className = 'form-row';
      rowParticiple.innerHTML = `<span class="form-label">Past Participle:</span> <span class="form-val hidden-test">${item.participle || '-'}</span>`;

      formsBox.appendChild(rowPast);
      formsBox.appendChild(rowParticiple);

      card.appendChild(infinitive);
      card.appendChild(fr);
      card.appendChild(formsBox);

      irregularGrid.appendChild(card);
    });
  }

  irregularSearch.addEventListener('input', renderIrregular);
  testModeCheck.addEventListener('change', renderIrregular);

  // =========================================================================
  // MODULE 5: GRAMMAIRE INTERACTIVE
  // =========================================================================
  const grammarContainer = document.getElementById('grammarContainer');
  const grammarCatFilter = document.getElementById('grammarCatFilter');
  const resetGrammarBtn = document.getElementById('resetGrammarBtn');

  // Populate Categories
  const grammarCats = Array.from(new Set(grammar.map(g => g.cat).filter(Boolean))).sort();
  grammarCats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    grammarCatFilter.appendChild(opt);
  });

  function renderGrammar() {
    const selectedCat = grammarCatFilter.value;
    const filtered = grammar.filter(g => !selectedCat || g.cat === selectedCat);

    grammarContainer.innerHTML = '';
    if (filtered.length === 0) {
      grammarContainer.innerHTML = '<div class="empty-lessons">Aucun exercice trouvé.</div>';
      return;
    }

    filtered.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'grammar-card';

      if (item.cat) {
        const badge = document.createElement('span');
        badge.className = 'grammar-cat-badge';
        badge.textContent = item.cat;
        card.appendChild(badge);
      }

      const sentence = document.createElement('h3');
      sentence.className = 'grammar-sentence';
      // Replace ___ with formatted blank spot
      const formattedSentence = item.sentence.replace('___', '<span class="blank-spot" id="blank-' + idx + '">___</span>');
      sentence.innerHTML = formattedSentence;
      card.appendChild(sentence);

      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'grammar-options';

      const feedback = document.createElement('div');
      feedback.className = 'grammar-feedback';

      (item.options || []).forEach(optText => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = optText;

        btn.addEventListener('click', () => {
          // Reset other option buttons in this card
          optionsDiv.querySelectorAll('.opt-btn').forEach(b => {
            b.classList.remove('correct', 'wrong');
            b.disabled = false;
          });

          const blankSpan = document.getElementById('blank-' + idx);

          if (optText.toLowerCase().trim() === item.answer.toLowerCase().trim()) {
            btn.classList.add('correct');
            feedback.className = 'grammar-feedback ok';
            feedback.textContent = '✨ Bravo ! Bonne réponse.';
            if (blankSpan) blankSpan.textContent = optText;
            speakWord(item.sentence.replace('___', optText));
          } else {
            btn.classList.add('wrong');
            feedback.className = 'grammar-feedback no';
            feedback.textContent = `❌ Mauvaise réponse. Essayez encore !`;
            if (blankSpan) blankSpan.textContent = '___';
          }
        });

        optionsDiv.appendChild(btn);
      });

      card.appendChild(optionsDiv);
      card.appendChild(feedback);
      grammarContainer.appendChild(card);
    });
  }

  grammarCatFilter.addEventListener('change', renderGrammar);
  resetGrammarBtn.addEventListener('click', renderGrammar);

  // =========================================================================
  // MODULE 6: LEÇONS PDF & UPLOAD
  // =========================================================================
  const uploadForm = document.getElementById('uploadForm');
  const uploadStatus = document.getElementById('uploadStatus');
  const lessonsGrid = document.getElementById('lessonsGrid');

  function fetchLessons() {
    fetch('/api/lessons')
      .then(r => r.json())
      .then(j => {
        const lessons = j.lessons || [];
        updateCounters(lessons.length);
        lessonsGrid.innerHTML = '';

        if (lessons.length === 0) {
          lessonsGrid.innerHTML = '<div class="empty-lessons">Aucun cours en PDF téléversé pour le moment.</div>';
          return;
        }

        lessons.forEach(ls => {
          const item = document.createElement('div');
          item.className = 'lesson-item';

          const titleBox = document.createElement('div');
          titleBox.className = 'lesson-title-box';

          const icon = document.createElement('span');
          icon.className = 'lesson-icon';
          icon.textContent = '📕';

          const name = document.createElement('span');
          name.className = 'lesson-name';
          name.textContent = ls.title || ls.filename;

          titleBox.appendChild(icon);
          titleBox.appendChild(name);

          const link = document.createElement('a');
          link.className = 'lesson-action-btn';
          link.href = '/uploads/' + encodeURIComponent(ls.filename);
          link.target = '_blank';
          link.textContent = 'Télécharger / Voir PDF';

          item.appendChild(titleBox);
          item.appendChild(link);

          lessonsGrid.appendChild(item);
        });
      })
      .catch(e => {
        console.warn('Could not fetch lessons:', e);
        lessonsGrid.innerHTML = '<div class="empty-lessons">Impossible de charger la liste des leçons.</div>';
      });
  }

  uploadForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fileEl = document.getElementById('lessonFile');
    const titleEl = document.getElementById('lessonTitle');

    if (!fileEl.files.length) {
      uploadStatus.style.color = 'var(--red)';
      uploadStatus.textContent = 'Veuillez sélectionner un fichier PDF.';
      return;
    }

    const fd = new FormData();
    fd.append('file', fileEl.files[0]);
    fd.append('title', titleEl.value || fileEl.files[0].name);

    uploadStatus.style.color = 'var(--brand)';
    uploadStatus.textContent = '⏳ Téléversement en cours...';

    fetch('/api/lessons/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          uploadStatus.style.color = 'var(--green)';
          uploadStatus.textContent = '✅ Cours téléversé avec succès !';
          uploadForm.reset();
          fetchLessons();
        } else {
          uploadStatus.style.color = 'var(--red)';
          uploadStatus.textContent = 'Erreur : ' + (j.error || 'échec de l\'envoi');
        }
      })
      .catch(e => {
        uploadStatus.style.color = 'var(--red)';
        uploadStatus.textContent = 'Erreur lors du téléversement.';
        console.warn(e);
      });
  });

  // Initial Renders
  updateCounters(0);
  renderVocab();
  renderPron();
  renderPhrasal();
  renderIrregular();
  renderGrammar();
  fetchLessons();
});
