# Super Tactics / Chetics

넥슨 〈슈퍼택틱스 / 체틱스〉 스타일의 블라인드 심리전 보드게임 웹 구현.
외부 게임 엔진 없이 HTML/CSS/Vanilla JS로 작성. **싱글(AI) 대전 + 온라인 2인 대전(Firebase) + 설치형 PWA.**

## 실행

- **로컬(싱글플레이만):** 정적 서버로 열기 — `npx serve` 후 표시되는 주소 접속.
  (서비스워커/PWA·온라인은 `http://localhost` 또는 HTTPS에서만 동작)
- **배포(온라인+PWA):** 아래 Firebase Hosting 참고.

## 게임 규칙 요약

- 별3~별1 / 숫자 1~9 / 특수(✂️제거반·🕵️스파이·🗡️별킬러·👑왕·💣폭탄).
- 💣폭탄: 부딪힌 유닛을 **무조건 격파**, 단 ✂️제거반에게만 해체. 👑왕·💣폭탄은 이동 불가.
- 🗡️별킬러는 ★별을 무조건 격파. 🕵️스파이는 죽을 때 가해자 정체를 폭로.
- Power 동점 시 **공격자(선공) 승리**. 직전에 움직인 말은 다음 턴에 **되돌아가기 금지**.
- 내 말이 적 스파이를 잡으면 **👁** 표시 — 내 정체가 상대에게 노출됨.
- 승리: 상대 👑왕 제거 또는 상대 이동 가능 유닛 전멸.
- 새 게임 설정: 맵 크기 / 장애물 프리셋(양 진영 180° 대칭·길 보장) / 특수 유닛 갯수.

## Firebase 온라인 멀티 설정

기존 Firebase 프로젝트를 **그대로 재사용** 가능 — 새 프로젝트 불필요. 웹 앱 1개 + Realtime Database만 추가하면 된다.

1. Firebase 콘솔에서 **Realtime Database** 생성(없다면).
2. **익명 인증** 활성화: Authentication → 로그인 방법 → 익명 사용 설정.
3. 웹 앱 설정값을 `index.html`의 `FIREBASE_CONFIG`(상단 `<script type="module">`)에 붙여넣기.
   `databaseURL`(RTDB) 포함 필수. (웹 config는 공개값이라 비밀이 아님.)
4. DB 보안 규칙은 `database.rules.json` 사용.

### 플레이 흐름
- 모드 선택 → **온라인 대전** → 방 만들기(코드 발급) / 방 참가(코드 입력).
- 각자 자기 진영 배치 후 **준비 완료** → 양측 준비되면 자동 시작.
- 매 턴 `gameState`가 RTDB로 동기화(`seq` 단조 증가로 에코 방지). 상대 말은 `?`로 블라인드.

### ⚠ anti-cheat 한계 (프로토타입)
턴제 동기화를 위해 전체 보드가 DB에 저장된다. 따라서 **상대가 DB를 직접 열람하면 배치를 볼 수 있다.**
완전 차단은 Cloud Functions/보안 규칙로 서버에서 상대 정보를 마스킹해야 하며 이는 후속 과제다.

## PWA

- `manifest.webmanifest` + `sw.js`(앱 셸 cache-first) + 아이콘(`icon.svg`, `icon-192.png`, `icon-512.png`).
- HTTPS(또는 localhost)에서 브라우저 "설치"로 홈 화면 추가, standalone 실행. 싱글플레이는 오프라인 동작.
- 아이콘 재생성: `node tools/gen-icons.js` (의존성 없음).

## Firebase Hosting 배포

```bash
npm i -g firebase-tools
firebase login
firebase use <YOUR_PROJECT_ID>
firebase deploy           # hosting + database 규칙
```

배포 후 발급되는 HTTPS 주소에서 PWA 설치/온라인 대전 모두 동작한다.

## 코드 구조

- 단일 `index.html`. 모든 상태는 `gameState` 객체 하나로 관리, `render()`는 `gameState`만 보고 그림(UI/로직 분리).
- 캔오니컬 좌표(`player`=호스트/하단, `ai`=게스트/상단) + `mySide`/`transformRC`로 양 클라이언트가 자기 말을 하단에 보도록 시점 변환.
- 설정 확장: `MAP_PRESETS` / `OBSTACLE_PRESETS` / `UNIT_CONFIG` 값만 바꿔 맵·장애물·덱 조정.
