const container = document.getElementById("osmd");
const regenButton = document.getElementById("regen");
const includeRests = document.getElementById("include-rests");
const trebleOnly = document.getElementById("treble-only");

const osmd = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
  drawingParameters: "compact",
  drawTitle: false,
  drawSubtitle: false,
  drawComposer: false,
  autoResize: true,
});

const treblePitches = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5"];
const bassPitches = ["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function noteToXml(pitch, duration) {
  if (pitch === "rest") {
    return `\n      <note>\n        <rest/>\n        <duration>${duration}</duration>\n        <type>quarter</type>\n      </note>`;
  }
  const step = pitch[0];
  const octave = pitch[pitch.length - 1];
  return `\n      <note>\n        <pitch>\n          <step>${step}</step>\n          <octave>${octave}</octave>\n        </pitch>\n        <duration>${duration}</duration>\n        <type>quarter</type>\n      </note>`;
}

function buildMeasure() {
  const duration = 1;
  const notes = [];
  const pool = trebleOnly.checked ? treblePitches : treblePitches.concat(bassPitches);

  for (let i = 0; i < 4; i += 1) {
    if (includeRests.checked && Math.random() < 0.2) {
      notes.push("rest");
      continue;
    }
    notes.push(randomChoice(pool));
  }

  return notes.map((pitch) => noteToXml(pitch, duration)).join("");
}

function buildMusicXML() {
  const clef = trebleOnly.checked ? "G" : "F";
  const clefLine = trebleOnly.checked ? 2 : 4;
  const measureNotes = buildMeasure();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>${clef}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>${measureNotes}
    </measure>
  </part>
</score-partwise>`;
}

async function renderScore() {
  const xml = buildMusicXML();
  await osmd.load(xml);
  osmd.render();
}

regenButton.addEventListener("click", renderScore);
includeRests.addEventListener("change", renderScore);
trebleOnly.addEventListener("change", renderScore);

renderScore();
