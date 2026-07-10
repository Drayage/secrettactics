# Secret Tactics (체틱스) — 블라인드 심리전 보드게임

단일 `index.html`(~2,500줄)에 게임 전체 포함. Firebase RTDB 온라인, PWA, GitHub Pages 배포.

## 파일 지도

- `index.html` — 게임 전체 (CSS/로직/AI/온라인). **큼: Grep으로 위치를 찾아 부분만 읽을 것.**
- `sw.js` — PWA 캐시 (HTML network-first — 유지할 것)
- `database.rules.json`, `firebase.json` — Firebase 규칙
- `tools/gen-icons.js` — 아이콘 생성

## 규칙

- **AI는 블라인드** — 상대 패를 컨닝하지 않는 설계가 확정임(과거 컨닝을 제거했음).
  AI 강화 시 정보 은닉을 유지하고, 전투 결과 추론(마킹) 방식으로 구현할 것.
- DB 경로는 `chetics_rooms/` 프리픽스 유지 — 같은 Firebase 프로젝트(deadline-38cdb)를
  여러 게임이 공유한다.
- 효과음은 둔탁한 우디 타격음 톤으로 확정(고역 억제) — 사운드 추가 시 톤 유지.
- 온라인 방 생성/참가 실패는 원인을 화면에 표시할 것 (조용한 실패 금지).
- SW/캐시/배포/모바일: webgame-ship 스킬, 온라인: firebase-online 스킬 참조.
