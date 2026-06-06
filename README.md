# Hawkeye 🦅

**Drohnen-gestützte Fassaden- & Risiko-Inspektion.** Statt für jede Inspektion ein
Bambusgerüst zu bauen, fliegt eine Drohne das Gebäude ab. Aus dem Drohnenvideo
rekonstruieren wir das Gebäude (oder den Raum) in **3D** und können darauf Schäden
— Risse in der Fassade, Setzungen etc. — **verorten, vermessen und einschätzen**,
ob repariert werden muss.

> Hackathon-Projekt (Hongkong). Diese README ist der zentrale Fahrplan: alles,
> was du brauchst, um aus einem Drohnenvideo ein 3D-Modell zu machen.

---

## Was hier drin ist

```
Hawkeye/
└── recon3d/              # 3D-Rekonstruktion (VGGT + Gaussian Splatting)
    ├── run.py            # Video → 3D-Punktwolke (scene.glb)        ← der schnelle Win
    ├── pipeline.py       # Video → foto-realistischer Fly-through (MP4)
    ├── core/             # Frame-Extraktion, Modell, GLB-Export, Personen-Masking
    ├── viewer/index.html # 3D-Viewer für den Mac-Browser (kein Build nötig)
    ├── data/clips/       # ← HIER deine Drohnenvideos rein (.mp4)
    └── README.md         # tiefe Details & Tuning-Optionen
```

**Wichtig:** Das Rechnen (VGGT + Splatting) braucht eine **NVIDIA-GPU** und läuft
**nicht auf dem Mac**. Wir mieten dafür stundenweise eine Cloud-GPU (RunPod) —
nur während wir rechnen, danach wieder aus. Der Mac hält den Code und zeigt am
Ende das fertige 3D-Modell.

---

## Strategie (für den Hackathon bewusst so gewählt)

- **Modell: VGGT-1B (frei).** NICHT VGGT-Omega — das ist auf HuggingFace „gated",
  Freischaltung dauert evtl. Tage. VGGT-1B läuft sofort, ohne Login.
- **Erst die Punktwolke (`run.py`), dann der Fly-through (`pipeline.py`).**
  Die Punktwolke ist in ~15 Min da und beweist, dass die Rekonstruktion klappt.
  Den hübschen Fly-through bauen wir nur drauf, wenn Zeit bleibt.

---

## Der komplette Ablauf

```
Mac (Code + Video)  ──upload──▶  RunPod-GPU  ──rechnen──▶  scene.glb / flythrough.mp4
                                                               │
Mac (Viewer im Browser)  ◀──download──────────────────────────┘
                            danach: GPU STOPPEN (sonst zahlst du weiter)
```

### Schritt 1 — Code auf die GPU bringen

Zwei Wege, einer reicht:

**A) Per GitHub (empfohlen, wenn ihr im Repo weiterarbeitet)**
```bash
# einmalig lokal: Repo zu GitHub pushen (siehe unten "Repo zu GitHub")
# dann auf dem Pod:
cd /workspace
git clone https://github.com/<dein-user>/Hawkeye.git
cd Hawkeye/recon3d
```

**B) Per Zip-Upload (kein GitHub nötig)**
Lokal liegt schon ein Zip bereit: `~/Desktop/recon3d.zip`.
In RunPods **JupyterLab** per Drag & Drop hochladen, dann im Terminal:
```bash
cd /workspace
unzip recon3d.zip
cd recon3d
```

### Schritt 2 — RunPod-GPU starten

1. [runpod.io](https://runpod.io) → Account, **5–10 $ Guthaben** aufladen.
2. **Pods → Deploy** → GPU: **RTX 4090 (24 GB)** (~0,40–0,70 $/h, reicht locker).
3. Template: **„RunPod PyTorch 2.x"** (CUDA 12.x — bringt torch + JupyterLab mit).
4. **Deploy On-Demand** → warten bis „Running".
5. **Connect → Connect to JupyterLab** (Port 8888). Dort: Datei-Browser + Terminal.

### Schritt 3 — Drohnenvideo hochladen

In JupyterLab dein Video (z.B. `gebaeude.mp4`) per Drag & Drop hochladen, dann:
```bash
mkdir -p /workspace/recon3d/data/clips
mv /workspace/gebaeude.mp4 /workspace/recon3d/data/clips/   # Name anpassen
```

### Schritt 4 — Einmalig installieren (~5–10 Min)
```bash
cd /workspace/recon3d
git clone https://github.com/facebookresearch/vggt.git && pip install -e vggt
pip install -e ".[gpu]"
```

### Schritt 5 — Rechnen

**Punktwolke (der schnelle Win):**
```bash
python run.py --clip data/clips/gebaeude.mp4 --out gebaeude \
    --backend vggt --max-frames 100
# → gebaeude/scene.glb
```

**Raum 3D-mappen (mit Personen im Bild):**
```bash
python run.py --clip data/clips/raum.mp4 --out raum \
    --backend vggt --max-frames 80 --mask-people
# → raum/scene.glb   (bewegte Personen werden ausgeblendet)
```

**Foto-realistischer Fly-through (optional, wenn Zeit — braucht nerfstudio):**
```bash
pip install nerfstudio
python pipeline.py --clip data/clips/gebaeude.mp4 --start 0 --end 20 \
    --out heroflug --max-frames 100 \
    --backend vggt --checkpoint facebook/VGGT-1B
# → heroflug/flythrough.mp4   (~15–25 Min Training)
```
> Bei `pipeline.py` MUSS `--checkpoint facebook/VGGT-1B` mit dabei sein,
> sonst sucht es nach dem (nicht vorhandenen) Omega-Checkpoint.

### Schritt 6 — Herunterladen, ansehen, GPU stoppen

1. In JupyterLab: Rechtsklick auf `gebaeude/scene.glb` (bzw. `heroflug/flythrough.mp4`)
   → **Download**.
2. **3D-Modell ansehen (auf dem Mac, ohne GPU):** die `scene.glb` neben
   `recon3d/viewer/index.html` legen, `index.html` im Browser öffnen → rotieren,
   zoomen, „Cinematic"-Modus zum Screen-Recorden für den Pitch.
3. **⚠️ RunPod-Dashboard → Pod → „Stop"** (oder „Terminate"). Sonst läuft die
   Abrechnung weiter.

---

## Befehls-Spickzettel

| Ziel | Befehl |
| --- | --- |
| Punktwolke aus Video | `python run.py --clip data/clips/X.mp4 --out X --backend vggt --max-frames 100` |
| Raum, Personen weg | `... --mask-people` ergänzen |
| Nur ein scharfes Fenster | `... --start 6 --end 16` ergänzen |
| Flächen verschmelzen (weniger „Schichten") | `... --voxel 0.004` ergänzen |
| Mehr Details / Abdeckung | `--max-frames 120` (mehr VRAM nötig) |
| Aus Einzelfotos statt Video | `--images-dir data/fotos` statt `--clip` |
| Fly-through-Video | `python pipeline.py --clip data/clips/X.mp4 --out X --backend vggt --checkpoint facebook/VGGT-1B` |
| Trajektorie ändern (ohne neu rechnen) | `python pipeline.py --out X --skip-recon --skip-train --interpolation-steps 60 --frame-rate 60` |

---

## So filmst du, damit die Rekonstruktion gelingt 🎥

Die Modelle brauchen **Parallaxe** — die Kamera muss sich **seitlich / um das
Objekt herum** bewegen, nicht nur geradeaus drauf zu.

- **Fassade:** Drohne **seitlich an der Wand entlang** oder im **Bogen** fliegen,
  nicht stur ran-/hoch-zoomen. Gleichmäßige Höhe, mehrere Bahnen für hohe Wände.
- **Raum:** langsam **schwenken und durch den Raum bewegen**, alle Wände abdecken,
  nicht aus einer Ecke stehen bleiben.
- **Langsam & ruhig** fliegen — Bewegungsunschärfe ist der Feind. (Die Pipeline
  pickt zwar die schärfsten Frames, aber das Material muss da sein.)
- **Genug Überlappung:** aufeinanderfolgende Blickwinkel sollten sich stark
  überlappen (Faustregel >60 %).
- **Video direkt einspeisen** (`--clip`) ist am einfachsten — Frames werden
  automatisch extrahiert. Eigene Screenshots nur, wenn du gezielt bestimmte
  Ansichten brauchst (dann `--images-dir <ordner>`, auch HEIC/iPhone geht).

---

## Wenn das Ergebnis matschig / löchrig ist

- **Matschig/flach** → meist Bewegung (Personen) oder wenig Textur, kein Bug:
  kürzeres, ruhiges Fenster mit `--start/--end`, EIN Clip, `--max-frames` hoch,
  `--voxel 0.004`.
- **Spärlich/verrauscht** → `--conf-percentile` runter, `--max-frames` hoch.
- **Out of memory** → `--max-frames` oder `--resolution` runter.
- Volle Liste: `recon3d/README.md`, Abschnitt „Tuning / troubleshooting".

---

## Repo zu GitHub pushen (für Weg A)

```bash
cd /Users/danielshamsi/Github/Hawkeye
git add .
git commit -m "recon3d pipeline + setup guide"
# Remote anlegen (einmalig), z.B. mit GitHub CLI:
gh repo create Hawkeye --private --source=. --remote=origin --push
# oder manuell: git remote add origin <url> && git push -u origin main
```
> **Keine großen Videos committen** — `data/clips/*.mp4` lieber per Upload auf den
> Pod bringen (Git LFS wäre die Alternative). Die `.gitignore` in `recon3d/`
> ignoriert bereits `out/`, Checkpoints (`*.pt`) und `__pycache__/`.

---

## Roadmap — vom 3D-Modell zur Risiko-Einschätzung

Das hier liefert die **3D-Geometrie**. Nächste Bausteine für das Hawkeye-Produkt:

1. **Riss-Erkennung** auf den Einzelframes (2D) — z.B. YOLO/Segmentierung auf
   Risse trainiert; `core/masks.py` zeigt schon, wie YOLO hier eingebunden wird.
2. **2D-Funde ins 3D-Modell projizieren** — über die von VGGT geschätzten
   Kamera-Posen lässt sich ein Riss im 2D-Frame auf die 3D-Fassade zurückrechnen
   (Verortung + grobe Vermessung).
3. **Schweregrad/Empfehlung** — Länge/Breite/Verlauf der Risse → Ampel
   „beobachten / reparieren / dringend".
