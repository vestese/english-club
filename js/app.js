/* =====================================================================
   app.js — entry point: home screen + navigation
   (loaded last)
   ===================================================================== */

window.CAA = window.CAA || {};

CAA.app = (function () {
  const U = () => CAA.util;

  function home() {
    U().history.length = 0;
    U().show((scr) => {
      const h = U().h;

      // word of the day (fail-safe)
      const vocab = (CAA.content && Array.isArray(CAA.content.vocabulary) && CAA.content.vocabulary.length)
        ? CAA.content.vocabulary
        : [{ en: "Welcome", emoji: "🌟" }];
      const wod = vocab[new Date().getDate() % vocab.length] || { en: "Welcome", emoji: "🌟" };

      scr.appendChild(h("div", { class: "hero" }, [
        h("h1", {}, ["Welcome to the Accra English Club ", h("span", { class: "brand-x" }, ["🌟"])]),
        h("p", { class: "sub" }, ["Improve your English with playful games, audio practice, and friendly team challenges."]),
        h("p", { class: "sub" }, ["Choose a game, learn new words, and build confidence every day."]),
        h("button", { class: "wod", title: "Listen", onclick: () => U().speak(wod.en) }, [
          "Word of the day: ", h("b", {}, [wod.en]), " ", wod.emoji || "🌟", "  🔊"
        ])
      ]));

      const grid = h("div", { class: "menu-grid" });

      grid.appendChild(h("div", { class: "menu-card group", onclick: () => CAA.meeting.setup() }, [
        h("div", { class: "ic" }, ["🗓️"]),
        h("h3", {}, ["Meeting Mode"]),
        h("p", {}, ["Runs the whole session: warm-up, Big Challenge, speaking, review, podium."]),
        h("span", { class: "ribbon" }, ["Ready-made club session →"])
      ]));

      grid.appendChild(h("div", { class: "menu-card group", onclick: () => CAA.group.menu() }, [
        h("div", { class: "ic" }, ["📺"]),
        h("h3", {}, ["Play in a group"]),
        h("p", {}, ["The Big Challenge, Anagram, Mystery Object, on the TV. One referee, teams, points."]),
        h("span", { class: "ribbon" }, ["Group games →"])
      ]));

      grid.appendChild(h("div", { class: "menu-card online", onclick: () => {
        try {
          if (window.CAA && window.CAA.multiplayer && typeof window.CAA.multiplayer.menu === "function") {
            window.CAA.multiplayer.menu();
          }
        } catch (err) {
          console.error("Multiplayer menu error:", err);
        }
      } }, [
        h("div", { class: "ic" }, ["🌐"]),
        h("h3", {}, ["Multiplayer server"]),
        h("p", {}, ["Create a room, invite players with the code, and play multiplayer games."]),
        h("span", { class: "ribbon" }, ["Multiplayer →"])
      ]));

      grid.appendChild(h("div", { class: "menu-card solo", onclick: () => CAA.solo.menu() }, [
        h("div", { class: "ic" }, ["🎯"]),
        h("h3", {}, ["Play solo"]),
        h("p", {}, ["Word Match, pronunciation, grammar, anagrams. At your own pace."]),
        h("span", { class: "ribbon" }, ["Personal practice →"])
      ]));

      grid.appendChild(h("div", { class: "menu-card manage", onclick: () => CAA.editor.menu() }, [
        h("div", { class: "ic" }, ["✏️"]),
        h("h3", {}, ["Manage content"]),
        h("p", {}, ["Add your own questions and words, no coding needed."]),
        h("span", { class: "ribbon" }, ["Content editor →"])
      ]));

      grid.appendChild(h("div", { class: "menu-card manage", onclick: season }, [
        h("div", { class: "ic" }, ["🏅"]),
        h("h3", {}, ["Season leaderboard"]),
        h("p", {}, ["Track team progress and celebrate weekly wins."]),
        h("span", { class: "ribbon" }, ["View the leaderboard →"])
      ]));

      scr.appendChild(grid);
    }, { replace: true });
  }

  /* ---------- Season leaderboard ---------- */
  function season() {
    U().show((scr) => {
      const h = U().h;
      scr.appendChild(h("h2", { class: "section-title" }, ["🏅 Season leaderboard"]));
      const data = U().store.get("season", {});
      const rows = Object.keys(data).map((name) => Object.assign({ name }, data[name]));
      rows.sort((a, b) => b.wins - a.wins || b.points - a.points);

      if (!rows.length) {
        scr.appendChild(h("p", { class: "section-sub" }, [
          "No games recorded yet. Play \"The Big Challenge\" in a group to fill the leaderboard!"
        ]));
      } else {
        const sb = h("div", { class: "scoreboard" });
        rows.forEach((t, i) => {
          sb.appendChild(h("div", { class: "score-chip" + (i === 0 ? " active" : "") }, [
            h("div", { class: "name" }, [`${i + 1}. ${t.name}`]),
            h("div", { class: "pts" }, [t.wins + " 🏆"]),
            h("small", { class: "section-sub" }, [`${t.points} pts · ${t.games} game(s)`])
          ]));
        });
        scr.appendChild(sb);
        scr.appendChild(h("div", { class: "row center mt-lg" }, [
          h("button", { class: "btn btn-ghost", onclick: () => {
            U().confirmBox("Clear the whole season leaderboard?", () => { U().store.set("season", {}); season(); });
          } }, ["🗑️ Reset the season"])
        ]));
      }
    });
  }

  return { home, season };
})();

/* ---------- Startup ---------- */
window.addEventListener("DOMContentLoaded", function () {
  try {
    // top-bar back button
    const back = document.getElementById("backBtn");
    if (back) back.addEventListener("click", () => CAA.util.back());
    // logo -> home
    const logo = document.getElementById("logo");
    if (logo) logo.addEventListener("click", () => CAA.util.goHome());
    // warm up the speech-synthesis voices
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    // keep a copy of the original content, then load edited content (if any)
    CAA.defaultContent = CAA.util.clone(CAA.content || {});
    var saved = CAA.util.store.get("content", null);
    if (saved && typeof saved === "object") {
      for (var k in saved) {
        if (Array.isArray(saved[k]) && saved[k].length > 0) {
          CAA.content[k] = saved[k];
        }
      }
    }
  } catch (e) {
    console.error("Initialization warning:", e);
  }
  CAA.app.home();
});

