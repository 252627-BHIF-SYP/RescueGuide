# 📋 RescueGuide – Product Backlog

**Projekt:** RescueGuide  
**Team:** Kilian, Erik  
**Letzte Aktualisierung:** Oktober 2026

---

## Legende

| Priorität | Bedeutung |
|-----------|-----------|
| 🔴 **Kritisch** | Must-have – ohne diese Funktion funktioniert das System nicht |
| 🟠 **Hoch** | Should-have – wichtig für den Kern-Usecase |
| 🟡 **Mittel** | Could-have – wertvoll, aber nicht blockierend |
| 🟢 **Niedrig** | Nice-to-have – Verbesserungen für spätere Sprints |

| Status | Bedeutung |
|--------|-----------|
| ✅ **Fertig** | Implementiert und getestet |
| 🔄 **In Arbeit** | Aktuell in Entwicklung |
| 📋 **Geplant** | Definiert, noch nicht begonnen |
| 💡 **Idee** | Konzept, noch nicht spezifiziert |

---

## Systemübersicht

RescueGuide besteht aus drei Hauptkomponenten:

- 📱 **Mobile App (CA)** – Flutter-App für Ersthelfer (Client Application)
- 🖥️ **Control Center (CC)** – Angular Web-App für Leitstellen-Mitarbeiter
- ⚙️ **Backend** – ASP.NET Core Minimal API mit PostgreSQL-Datenbank

---

## EPIC 1: Authentifizierung & Benutzerverwaltung

### 🔴 US-001 – Registrierung (Control Center)
**Als** Leitstellen-Mitarbeiter  
**möchte ich** mich mit Name, E-Mail und Passwort registrieren,  
**damit** ich Zugang zum Control Center erhalte.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | CC Frontend + Backend |
| **Akzeptanzkriterien** | Registrierungsformular vorhanden; JWT-Token wird ausgestellt; Fehler bei doppelter E-Mail |

---

### 🔴 US-002 – Login (Control Center)
**Als** Leitstellen-Mitarbeiter  
**möchte ich** mich mit meinen Zugangsdaten einloggen,  
**damit** ich das Control Center nutzen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | CC Frontend + Backend |
| **Akzeptanzkriterien** | Login-Seite vorhanden; JWT-Token gespeichert; Route-Guard schützt gesicherte Seiten |

---

### 🔴 US-003 – Logout (Control Center)
**Als** Leitstellen-Mitarbeiter  
**möchte ich** mich aus dem System abmelden,  
**damit** unbefugte Nutzung meines Accounts verhindert wird.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | CC Frontend |
| **Akzeptanzkriterien** | Token wird gelöscht; Weiterleitung zur Login-Seite |

---

### 🟠 US-004 – Login (Mobile App)
**Als** Ersthelfer  
**möchte ich** mich in der mobilen App anmelden,  
**damit** meine Nutzerdaten gespeichert und meine Einsätze zugeordnet werden können.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Login-Screen vorhanden; Token wird gespeichert |

---

### 🟡 US-005 – Benutzerprofil (Mobile App)
**Als** Ersthelfer  
**möchte ich** mein Profil mit medizinischen Stammdaten (Blutgruppe, Allergien, Vorerkrankungen, Medikamente) anlegen,  
**damit** diese im Notfall für Rettungskräfte sichtbar sind.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Felder: Name, Geburtsdatum, Blutgruppe, Allergien, Vorerkrankungen, Medikamente; Daten werden gespeichert und abrufbar |

---

## EPIC 2: Notfallmodus (Mobile App – Ersthelfer)

### 🔴 US-010 – Notfallmodus starten
**Als** Ersthelfer  
**möchte ich** den Notfallmodus möglichst schnell starten,  
**damit** im Stressfall keine Zeit verloren geht.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Panic-Button auf Startscreen; Notfall wird im Backend angelegt; Connecting-Screen wird angezeigt |

---

### 🔴 US-011 – Verbindung zur Leitstelle herstellen
**Als** Ersthelfer  
**möchte ich** automatisch eine Verbindung zur Leitstelle aufbauen,  
**damit** ich sofort Anweisungen erhalten kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Mobile App, Signaling-Server |
| **Akzeptanzkriterien** | WebRTC-Verbindung wird aufgebaut; Connecting-Screen informiert über Status; Weiterleitung zur Emergency-Page |

---

### 🔴 US-012 – Sprachverbindung mit der Leitstelle
**Als** Ersthelfer  
**möchte ich** über die App mit dem Leitstellenmitarbeiter sprechen können,  
**damit** ich die Situation schildern kann und Anweisungen erhalte.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Mobile App + CC, Signaling + COTURN |
| **Akzeptanzkriterien** | Bidirektionale Audioverbindung; Mikrofon-Stummschaltung möglich |

---

### 🔴 US-013 – Videoverbindung mit der Leitstelle
**Als** Ersthelfer  
**möchte ich** optional eine Videoverbindung zur Leitstelle starten,  
**damit** die Leitstelle die Situation visuell einschätzen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Mobile App + CC, COTURN-Server |
| **Akzeptanzkriterien** | Kamera-Stream wird an Leitstelle übertragen; Kamera kann deaktiviert werden |

---

### 🔴 US-014 – Standortfreigabe im Notfall
**Als** Ersthelfer  
**möchte ich** meinen GPS-Standort automatisch an die Leitstelle übermitteln,  
**damit** Rettungskräfte mich schnell finden.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | GPS-Koordinaten werden beim Notfallstart an Backend gesendet; Standort im CC sichtbar |

---

### 🟠 US-015 – Schritt-für-Schritt-Anweisungen empfangen
**Als** Ersthelfer  
**möchte ich** von der Leitstelle gesendete Maßnahmen als Schritt-für-Schritt-Anleitung sehen,  
**damit** ich strukturiert handeln kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Anweisungen werden in Echtzeit angezeigt; Fortschritt ist erkennbar |

---

### 🟠 US-016 – Checkliste abhaken
**Als** Ersthelfer  
**möchte ich** erledigte Schritte in der Anleitung abhaken,  
**damit** ich den Überblick behalte und nichts vergesse.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | CC, Mobile App |
| **Akzeptanzkriterien** | Schritte können als erledigt markiert werden; Fortschrittsanzeige vorhanden |

---

### 🟠 US-017 – Notfallmodus beenden
**Als** Leitstellenmitarbeiter  
**möchte ich** den Notfallmodus beenden können,  
**damit** der Einsatz korrekt abgeschlossen wird.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Notfall wird als "Completed" markiert; EndedAt-Zeitstempel gesetzt |

---

### 🟡 US-018 – Audioanleitung (Text-to-Speech)
**Als** Ersthelfer  
**möchte ich** Anweisungen auch als gesprochene Ausgabe hören,  
**damit** ich die App unter Stress ohne visuellen Fokus nutzen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | TTS-Ausgabe für Anweisungsschritte; Ein-/Ausschalten möglich |

---

### 🟢 US-019 – Animierte Anleitungsbilder
**Als** Ersthelfer  
**möchte ich** Anleitungsschritte als animierte Bilder oder GIFs sehen,  
**damit** ich die Maßnahmen schnell visuell erfassen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟢 Niedrig |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Animationen/Bilder können pro Schritt hinterlegt und angezeigt werden |

---

## EPIC 3: Leitstellen-Steuerung (Control Center)

### 🔴 US-020 – Dashboard mit aktiven Notfällen
**Als** Leitstellen-Mitarbeiter  
**möchte ich** eine Übersicht aller aktiven und abgeschlossenen Einsätze sehen,  
**damit** ich schnell reagieren und den Überblick behalten kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | Liste aller Notfälle mit Status, Zeit, Einsatzart, Adresse und Disponenten-Name; nach Datum sortiert |

---

### 🔴 US-021 – Notfall annehmen und öffnen
**Als** Leitstellen-Mitarbeiter  
**möchte ich** einen eingehenden Notfall annehmen und die Detailseite öffnen,  
**damit** ich den Einsatz bearbeiten kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | CC |
| **Akzeptanzkriterien** | Benachrichtigung bei neuem Notfall; Weiterleitung auf Emergency-Page möglich |

---

### 🔴 US-022 – Einsatzprotokoll ausfüllen
**Als** Leitstellen-Mitarbeiter  
**möchte ich** während und nach dem Einsatz ein Protokoll mit allen relevanten Daten ausfüllen,  
**damit** der Einsatz vollständig dokumentiert ist.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | Felder: Einsatzart, Anrufername, Anrufertyp, Rückrufnummer, Adresse, Anzahl Verletzte, Beschreibung, Disponenten-Name, Datum/Zeit, alarmierte Kräfte (RD/NA/Pol/FW) |

---

### 🟠 US-023 – Standort des Ersthelfers anzeigen
**Als** Leitstellen-Mitarbeiter  
**möchte ich** den GPS-Standort des Ersthelfers sehen,  
**damit** ich Rettungskräfte effizienter dirigieren kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | Koordinaten werden im Backend gespeichert; Adresse wird per Reverse-Geocoding ermittelt und im CC angezeigt |

---

### 🟠 US-024 – Maßnahmen-Plan an Ersthelfer senden
**Als** Leitstellen-Mitarbeiter  
**möchte ich** einen vordefinierten Maßnahmen-Plan (Checkliste) an den Ersthelfer senden,  
**damit** dieser strukturiert durch die Ersten-Hilfe-Maßnahmen geführt wird.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | Pläne mit geordneten Maßnahmen können ausgewählt und gesendet werden |

---

### 🟠 US-025 – Video-Fenster des Ersthelfers im CC anzeigen
**Als** Leitstellen-Mitarbeiter  
**möchte ich** den Video-Stream des Ersthelfers in einem Fenster im Control Center sehen,  
**damit** ich die Situation vor Ort visuell einschätzen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | CC, WebRTC, COTURN |
| **Akzeptanzkriterien** | Video-Stream wird in der Emergency-Page angezeigt; Fenstergröße ist anpassbar; korrekte Darstellung in der UI |

---

### 🟠 US-026 – Notfall schließen und abschließen
**Als** Leitstellen-Mitarbeiter  
**möchte ich** einen Notfall als abgeschlossen markieren,  
**damit** er aus der aktiven Liste verschwindet und korrekt dokumentiert ist.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | Status auf "Completed"; EndedAt gesetzt; Einsatzart aus Protokoll übernommen |

---

### 🟠 US-027 – Maßnahmen verwalten (CRUD)
**Als** Leitstellen-Mitarbeiter  
**möchte ich** einzelne Maßnahmen anlegen, bearbeiten und löschen,  
**damit** die Maßnahmenbibliothek aktuell gehalten werden kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | Vollständiges CRUD für Maßnahmen; Maßnahmen haben Name, Beschreibung und optionales Bild |

---

### 🟠 US-028 – Pläne verwalten (CRUD) mit Sortierung
**Als** Leitstellen-Mitarbeiter  
**möchte ich** Pläne aus Maßnahmen zusammenstellen und die Reihenfolge der Maßnahmen festlegen,  
**damit** der Ersthelfer die Maßnahmen in der richtigen Reihenfolge ausführt.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | Maßnahmen können per Drag-and-Drop oder Pfeil-Buttons sortiert werden; Reihenfolge wird korrekt gespeichert |

---

### 🟡 US-029 – Alarm-Benachrichtigung bei neuem Notfall
**Als** Leitstellen-Mitarbeiter  
**möchte ich** eine akustische und visuelle Benachrichtigung erhalten, wenn ein neuer Notfall eingeht,  
**damit** ich keinen Notfall verpasse.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | ✅ Fertig |
| **Komponente** | CC |
| **Akzeptanzkriterien** | Benachrichtigung erscheint; Alarm-Sound wird abgespielt; Klick leitet auf Notfall-Seite |

---

### 🟡 US-030 – Einsatz-Dokumentation exportieren
**Als** Leitstellen-Mitarbeiter  
**möchte ich** das Einsatzprotokoll exportieren können (z.B. als PDF),  
**damit** ich es für Berichte oder rechtliche Zwecke nutzen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | CC, Backend |
| **Akzeptanzkriterien** | PDF-Export des Protokolls mit allen Feldern; inkl. Zeitstempel aller Aktionen |

---

## EPIC 4: Offline-Hilfemodus / Fast-Help (Mobile App)

### 🟠 US-040 – Schnell-Hilfe ohne Leitstellenverbindung
**Als** Ersthelfer  
**möchte ich** auch ohne aktive Verbindung zur Leitstelle eine Erste-Hilfe-Anleitung erhalten,  
**damit** ich in jedem Fall handeln kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | FastHelp-Modus ist ohne Login/Internet zugänglich; häufige Notfallszenarien verfügbar |

---

### 🟠 US-041 – Symptom-geführte Auswahl (Ja/Nein-Menü)
**Als** Ersthelfer  
**möchte ich** durch einfache Ja/Nein-Fragen zur passenden Anleitung geführt werden,  
**damit** ich auch ohne Vorkenntnisse schnell die richtige Hilfe finde.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Kategoriebaum mit Ja/Nein-Entscheidungen; Führt zu konkreter Schritt-für-Schritt-Anleitung |

---

### 🟠 US-042 – Offline-Verfügbarkeit der Anleitungen
**Als** Ersthelfer  
**möchte ich** Anleitungen auch ohne Internetverbindung nutzen können,  
**damit** ich auch in Gebieten mit schlechtem Empfang Hilfe bekomme.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Anleitungen werden lokal gecacht; Offline-Modus ist erkennbar gekennzeichnet |

---

### 🟡 US-043 – Favoriten-Szenarien speichern
**Als** Ersthelfer  
**möchte ich** häufig genutzte Notfallszenarien als Favoriten speichern,  
**damit** ich sie im Notfall sofort aufrufen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Szenarien können als Favorit markiert werden; Favoriten auf Startscreen sichtbar |

---

## EPIC 5: Quiz- und Lernmodus (Mobile App)

### 🟠 US-050 – Quiz starten
**Als** Nutzer  
**möchte ich** ein Quiz zu einem Erste-Hilfe-Thema starten können,  
**damit** ich mein Wissen spielerisch teste.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Quizauswahl nach Thema; Multiple-Choice-Fragen mit sofortigem Feedback |

---

### 🟠 US-051 – Quiz-Auswertung anzeigen
**Als** Nutzer  
**möchte ich** nach dem Quiz eine Auswertung mit richtigen und falschen Antworten sehen,  
**damit** ich aus meinen Fehlern lernen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Punktestand angezeigt; richtige Antworten für falsch beantwortete Fragen sichtbar |

---

### 🟡 US-052 – Falsch beantwortete Fragen wiederholen
**Als** Nutzer  
**möchte ich** nach einem Quiz nur die falsch beantworteten Fragen nochmals üben,  
**damit** ich gezielt an meinen Schwächen arbeite.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | "Fehler wiederholen"-Button nach Quiz; Nur falsch beantwortete Fragen werden erneut gestellt |

---

### 🟡 US-053 – Lernblöcke zu Themen
**Als** Nutzer  
**möchte ich** strukturierte Lerninhalte zu Themen wie Bewusstlosigkeit oder Verbrennungen durcharbeiten,  
**damit** ich mein theoretisches Wissen aufbaue.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Lerneinheiten nach Thema geordnet; Fortschrittsanzeige; Offline-fähig |

---

### 🟡 US-054 – Tägliche Erinnerungen
**Als** Nutzer  
**möchte ich** tägliche Push-Benachrichtigungen erhalten, die mich ans Lernen erinnern,  
**damit** ich regelmäßig mein Erste-Hilfe-Wissen auffrische.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Push-Benachrichtigungen konfigurierbar (Zeit, Häufigkeit); opt-in/opt-out möglich |

---

### 🟢 US-055 – Lern-Streak und Gamification
**Als** Nutzer  
**möchte ich** meinen Lernfortschritt als Streak sehen und Abzeichen verdienen,  
**damit** ich motiviert bleibe, regelmäßig zu lernen.

| Feld | Wert |
|------|------|
| **Priorität** | 🟢 Niedrig |
| **Status** | 💡 Idee |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | Tages-Streak sichtbar; Abzeichen für Meilensteine; Fortschrittsbalken |

---

## EPIC 6: Infrastruktur & Kommunikation

### 🔴 US-060 – WebRTC Signaling-Server
**Als** System  
**soll** ein Signaling-Server WebRTC-Verbindungen zwischen der mobilen App und dem Control Center koordinieren,  
**damit** Audio- und Videoverbindungen möglich sind.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Signaling-Server, CC |
| **Akzeptanzkriterien** | WebSocket-basiertes Signaling; SDP-Austausch und ICE-Kandidaten-Weiterleitung funktionieren |

---

### 🔴 US-061 – COTURN STUN/TURN-Server
**Als** System  
**soll** ein COTURN-Server NAT-Traversal für WebRTC ermöglichen,  
**damit** auch hinter Firewalls und in Mobilfunknetzen Verbindungen aufgebaut werden können.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Infra, COTURN |
| **Akzeptanzkriterien** | TURN-Relay für Verbindungen ohne direkten Peer-Kontakt; STUN für NAT-Erkennung |

---

### 🔴 US-062 – Backend REST-API
**Als** Entwickler  
**soll** das Backend alle Kernfunktionen als REST-API bereitstellen,  
**damit** Mobile App und Control Center auf dieselben Daten zugreifen.

| Feld | Wert |
|------|------|
| **Priorität** | 🔴 Kritisch |
| **Status** | ✅ Fertig |
| **Komponente** | Backend |
| **Akzeptanzkriterien** | Alle Controller implementiert; JWT-Auth; OpenAPI/Scalar-Dokumentation vorhanden |

---

### 🟠 US-063 – Docker-Deployment
**Als** Entwickler  
**möchte ich** alle Komponenten als Docker-Container deployen,  
**damit** das System einfach auf jedem Server gestartet werden kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | Alle Komponenten, Infra |
| **Akzeptanzkriterien** | Docker-Images für Backend, CC-Frontend, CA-Frontend, Signaling; docker-compose vorhanden |

---

### 🟠 US-064 – GitHub CI/CD Workflow
**Als** Entwickler  
**möchte ich** automatisierte Build- und Deploy-Pipelines über GitHub Actions,  
**damit** Code-Qualität gesichert und Deployments automatisiert sind.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | .github/workflows/ |
| **Akzeptanzkriterien** | Build und Tests bei jedem Push/PR; automatisches Docker-Image-Build |

---

### 🟡 US-065 – Reverse-Geocoding für Standortadressen
**Als** Leitstellen-Mitarbeiter  
**möchte ich** den GPS-Standort des Ersthelfers als lesbare Adresse sehen,  
**damit** ich den Einsatzort sofort erkennen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | ✅ Fertig |
| **Komponente** | Backend |
| **Akzeptanzkriterien** | GPS-Koordinaten werden via Nominatim in eine Adresse umgewandelt; gecacht zur Vermeidung von API-Limits |

---

## EPIC 7: Barrierefreiheit & Benutzerfreundlichkeit

### 🟠 US-070 – Große Buttons und hoher Kontrast
**Als** Ersthelfer  
**möchte ich** eine App mit großen, gut lesbaren Buttons und hohem Farbkontrast,  
**damit** ich sie auch unter Stress und bei Aufregung bedienen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ In Arbeit |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | WCAG 2.1 AA Kontrastverhältnis; Buttons mindestens 48x48 dp |

---

### 🟡 US-071 – Sprachausgabe (Accessibility)
**Als** Nutzer mit eingeschränkter Sehfähigkeit  
**möchte ich**, dass die App mit Screenreadern kompatibel ist und eine integrierte Sprachausgabe hat,  
**damit** ich die App vollständig nutzen kann.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Semantische Labels für alle UI-Elemente; Kompatibilität mit TalkBack (Android) und VoiceOver (iOS) |

---

### 🟡 US-072 – Tutorial für neue Nutzer
**Als** neuer Nutzer  
**möchte ich** beim ersten Start ein kurzes Tutorial durchlaufen,  
**damit** ich die wichtigsten Funktionen der App lerne.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Onboarding-Flow mit max. 5 Screens; überspringbar; nicht bei jedem Start |

---

### 🟡 US-073 – Demo-Notfall (Dry Run)
**Als** Nutzer  
**möchte ich** einen simulierten Notfall durchspielen können,  
**damit** ich im Ernstfall weiß, wie die App funktioniert.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Demo-Modus startet keinen echten Notruf; klar als Demo gekennzeichnet |

---

### 🟢 US-074 – App-Performance-Optimierung
**Als** Nutzer  
**möchte ich**, dass die App schnell lädt und flüssig läuft,  
**damit** im Notfall keine Zeit durch Ladezeiten verloren geht.

| Feld | Wert |
|------|------|
| **Priorität** | 🟢 Niedrig |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, CC Frontend |
| **Akzeptanzkriterien** | Startzeit < 2 Sekunden; Notfallmodus-Start < 3 Sekunden |

---

## EPIC 8: Datenschutz & Sicherheit

### 🟠 US-080 – Granulare Berechtigungsverwaltung
**Als** Nutzer  
**möchte ich** Kamera, Mikrofon und Standort einzeln freigeben oder verweigern können,  
**damit** ich die Kontrolle über meine Daten behalte.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Berechtigungsanfragen separat; Nutzung funktioniert auch ohne Kamera/Standort (eingeschränkt) |

---

### 🟠 US-081 – Verschlüsselte Datenübertragung
**Als** Nutzer  
**möchte ich**, dass alle Daten (Audio, Video, Standort) verschlüsselt übertragen werden,  
**damit** meine sensiblen Daten geschützt sind.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | ✅ Fertig |
| **Komponente** | Gesamte Infrastruktur |
| **Akzeptanzkriterien** | HTTPS für alle API-Calls; WebRTC nutzt DTLS/SRTP-Verschlüsselung |

---

### 🟡 US-082 – Datensparsamkeit
**Als** Nutzer  
**möchte ich**, dass nur die für den Notfall notwendigen Daten gespeichert werden,  
**damit** meine Privatsphäre gewahrt wird.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Backend |
| **Akzeptanzkriterien** | Kein Speichern von Video/Audio-Aufnahmen; Standortdaten nur während aktivem Einsatz; DSGVO-konformes Datenschutzkonzept |

---

## EPIC 9: Medizinische Qualität

### 🟠 US-090 – Anleitungen auf Basis offizieller Standards
**Als** Nutzer  
**möchte ich**, dass alle Erste-Hilfe-Anleitungen auf offiziellen Standards (ERC, Rotes Kreuz) basieren,  
**damit** ich korrekten medizinischen Anweisungen folge.

| Feld | Wert |
|------|------|
| **Priorität** | 🟠 Hoch |
| **Status** | 📋 Geplant |
| **Komponente** | Inhalt |
| **Akzeptanzkriterien** | Quellen für alle Anleitungen dokumentiert; regelmäßige Review-Zyklen definiert |

---

### 🟡 US-091 – Haftungsausschluss-Hinweis
**Als** Nutzer  
**möchte ich** einen klaren Hinweis erhalten, dass die App keine professionelle medizinische Diagnose ersetzt,  
**damit** ich die Grenzen der App verstehe.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, CC |
| **Akzeptanzkriterien** | Hinweis beim ersten Start; Disclaimer im Fast-Help-Modus sichtbar |

---

### 🟡 US-092 – Aktualitätsdatum der Inhalte
**Als** Nutzer  
**möchte ich** sehen, wann eine Anleitung zuletzt aktualisiert wurde,  
**damit** ich weiß, ob die Informationen noch aktuell sind.

| Feld | Wert |
|------|------|
| **Priorität** | 🟡 Mittel |
| **Status** | 📋 Geplant |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | UpdatedAt-Feld in Anleitungs-Entitäten; Datum in der UI sichtbar |

---

## EPIC 10: KI-Unterstützung (Optional)

### 🟢 US-100 – KI-basierte Situationseinschätzung
**Als** Ersthelfer  
**möchte ich** eine KI-gestützte Ersteinschätzung der Situation erhalten,  
**damit** ich schneller zur richtigen Anleitung geführt werde.

| Feld | Wert |
|------|------|
| **Priorität** | 🟢 Niedrig |
| **Status** | 💡 Idee |
| **Komponente** | Mobile App, Backend |
| **Akzeptanzkriterien** | KI-Einschätzung mit klarem Disclaimer; Vorschlag von passender Anleitung; KI ersetzt keine Leitstelle |

---

### 🟢 US-101 – KI-Disclaimer
**Als** Nutzer  
**möchte ich** einen unmissverständlichen Hinweis erhalten, dass die KI keine professionelle Diagnose stellt,  
**damit** ich nicht auf eine fehlerhafte KI-Einschätzung vertraue.

| Feld | Wert |
|------|------|
| **Priorität** | 🟢 Niedrig |
| **Status** | 💡 Idee |
| **Komponente** | Mobile App |
| **Akzeptanzkriterien** | Prominenter Disclaimer; muss aktiv bestätigt werden |

---