# Huzy Log

Next.js 기반 PM2 로그 수집/분석 대시보드입니다. 프로젝트에 PM2 app name만 등록하면 `pm2 jlist`에서 stdout/stderr 로그 파일 경로를 찾고, 읽은 로그와 offset을 MariaDB에 저장합니다.

## Setup

```bash
pnpm install
pnpm run db:init
pnpm run build
pm2 start ecosystem.config.cjs
pm2 save
```

초기 관리자 계정은 `admin / admin`입니다. 최초 로그인 후 비밀번호 변경 페이지로 이동합니다.

## Agent Hook

프로젝트 화면에서 토큰을 발급한 뒤 외부 AI agent가 다음 API를 호출할 수 있습니다.

```bash
curl -H "Authorization: Bearer hlog_xxx" \
  "https://your-host/api/agent/logs?severity=error&limit=100"
```

응답에는 프로젝트 정보, 최근 에러 로그, fingerprint 기준 그룹이 포함됩니다.

## Log Collector

`huzy-log-collector` PM2 process가 `scripts/collect-pm2-logs.mjs --watch`를 실행합니다. 서버가 재시작되어도 MariaDB의 `log_entries`와 `log_offsets`가 유지되므로 수집된 로그는 삭제되지 않습니다.
# huzy-log
